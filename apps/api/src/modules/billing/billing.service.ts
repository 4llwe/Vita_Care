import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaymentService } from './payment.service';
import { NotificationService } from '../notification/notification.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payment: PaymentService,
    private readonly notify: NotificationService,
  ) {}

  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.invoice.count({ where: { issuedAt: { gte: start } } });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /** Hitung subtotal, pajak, total dari item. */
  static computeTotals(
    items: Array<{ qty: number; unitPrice: number }>,
    taxPercent = 0,
  ): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const tax = Math.round((subtotal * taxPercent) / 100);
    return { subtotal, tax, total: subtotal + tax };
  }

  async createInvoice(dto: CreateInvoiceDto) {
    const { subtotal, tax, total } = BillingService.computeTotals(dto.items, dto.taxPercent ?? 0);
    const code = await this.generateCode();
    return this.prisma.invoice.create({
      data: {
        code,
        bookingId: dto.bookingId,
        patientName: dto.patientName,
        subtotal,
        tax,
        total,
        status: InvoiceStatus.UNPAID,
        items: {
          create: dto.items.map((it) => ({
            description: it.description,
            qty: it.qty,
            unitPrice: it.unitPrice,
            amount: it.qty * it.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  /** Buat transaksi Midtrans untuk sebuah invoice & simpan snapToken. */
  async pay(invoiceId: string, actor: { id: string; role: string }) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
    if (!inv) throw new NotFoundException('Invoice tidak ditemukan');
    await this.assertPatientOwnership(inv.id, actor);
    if (inv.status === InvoiceStatus.PAID) throw new BadRequestException('Invoice sudah lunas');

    const orderId = `${inv.code}-${Date.now()}`;
    const charge = await this.payment.createTransaction({
      orderId,
      grossAmount: inv.total,
      customerName: inv.patientName,
      items: inv.items.map((it) => ({ id: it.id, name: it.description, price: it.unitPrice, quantity: it.qty })),
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { midtransOrderId: orderId, snapToken: charge.snapToken, status: InvoiceStatus.PENDING },
    });
    return { snapToken: charge.snapToken, redirectUrl: charge.redirectUrl };
  }

  /** Tangani webhook Midtrans: verifikasi signature lalu update status. */
  async handleWebhook(body: any) {
    const valid = this.payment.verifySignature({
      order_id: body.order_id,
      status_code: body.status_code,
      gross_amount: body.gross_amount,
      signature_key: body.signature_key,
    });
    if (!valid) throw new BadRequestException('Signature tidak valid');

    const invoice = await this.prisma.invoice.findUnique({ where: { midtransOrderId: body.order_id } });
    if (!invoice) throw new NotFoundException('Invoice untuk order ini tidak ditemukan');

    const mapped = this.payment.mapStatus(body.transaction_status, body.fraud_status);
    const statusMap = { PAID: InvoiceStatus.PAID, PENDING: InvoiceStatus.PENDING, FAILED: InvoiceStatus.FAILED } as const;

    await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        method: body.payment_type,
        grossAmount: Number(body.gross_amount),
        status: body.transaction_status,
        transactionTime: body.transaction_time ? new Date(body.transaction_time) : undefined,
        rawPayload: body,
      },
    });

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: statusMap[mapped], paidAt: mapped === 'PAID' ? new Date() : undefined },
    });

    if (mapped === 'PAID') {
      await this.notify.send({
        channel: 'whatsapp',
        title: 'Pembayaran Diterima',
        body: `Invoice ${invoice.code} telah LUNAS. Terima kasih.`,
      });
    }
    return { ok: true, status: mapped };
  }

  async findOne(id: string, actor: { id: string; role: string }) { await this.assertPatientOwnership(id, actor); return this.prisma.invoice.findUniqueOrThrow({ where: { id }, include: { items: true, payments: true } }); }
  myInvoices(userId: string) { return this.prisma.invoice.findMany({ where: { booking: { patientUserId: userId } }, orderBy: { issuedAt: "desc" }, include: { items: true } }); }
  private async assertPatientOwnership(id: string, actor: { id: string; role: string }) { if (actor.role !== "PATIENT") return; const owned = await this.prisma.invoice.findFirst({ where: { id, booking: { patientUserId: actor.id } }, select: { id: true } }); if (!owned) throw new ForbiddenException("Tagihan tidak tersedia untuk akun ini"); }

  findAll() {
    return this.prisma.invoice.findMany({ orderBy: { issuedAt: 'desc' }, include: { items: true } });
  }
}
