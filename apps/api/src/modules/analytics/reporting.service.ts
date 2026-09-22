import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VITA_BRAND, rupiah, tanggalIndo } from '../../common/branding';
import { buildPdf, drawLetterhead, kvRow, sectionTitle, signatureBlock, simpleTable } from '../../common/pdf/pdf-builder';
import { AnalyticsService } from './analytics.service';

/** Escape nilai agar aman untuk format CSV (kompatibel Excel). */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  // BOM agar Excel mengenali UTF-8
  return '\uFEFF' + lines.join('\r\n');
}

const URGENCY_LABEL: Record<string, string> = {
  ROUTINE: 'Rutin',
  URGENT: 'Mendesak',
  EMERGENCY: 'DARURAT',
};

@Injectable()
export class ReportingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ============ PDF: Laporan Manajemen (ringkasan KPI) ============
  async managementReportPdf(): Promise<Buffer> {
    const s = await this.analytics.dashboard();
    return buildPdf((doc) => {
      drawLetterhead(doc, 'LAPORAN MANAJEMEN MUTU & OPERASIONAL');

      sectionTitle(doc, 'Ringkasan Layanan (Booking)');
      kvRow(doc, 'Total Kunjungan', String(s.bookings.total));
      kvRow(doc, 'Sedang Berjalan', String(s.bookings.aktif));
      kvRow(doc, 'Selesai', String(s.bookings.selesai));

      sectionTitle(doc, 'Pendapatan');
      kvRow(doc, 'Lunas', rupiah(s.revenue.lunas));
      kvRow(doc, 'Tertunda', rupiah(s.revenue.tertunda));

      sectionTitle(doc, 'Temuan Audit per Kategori');
      const catRows = Object.entries(s.findings.perKategori).map(([k, v]) => [k, String(v)]);
      if (catRows.length) {
        simpleTable(doc, ['Kategori', 'Jumlah'], catRows, [360, 135]);
      } else {
        doc.font('Helvetica').fontSize(10).text('Tidak ada temuan.');
      }
      kvRow(doc, 'Total Temuan', String(s.findings.total));

      sectionTitle(doc, 'Status CAPA');
      simpleTable(
        doc,
        ['Open', 'In Progress', 'Verified', 'Overdue'],
        [[String(s.capa.open), String(s.capa.inProgress), String(s.capa.verified), String(s.capa.overdue)]],
        [124, 124, 124, 123],
      );

      sectionTitle(doc, 'Risiko');
      kvRow(doc, 'Total Risiko', String(s.risks.total));
      kvRow(doc, 'Risiko Tinggi/Kritis', String(s.risks.tinggi));

      signatureBlock(doc, 'Direktur Vita Care Lombok');
    });
  }

  // ============ PDF: Surat Rujukan ============
  async referralPdf(id: string): Promise<{ buffer: Buffer; code: string }> {
    const ref = await this.prisma.referral.findUnique({ where: { id }, include: { booking: true } });
    if (!ref) throw new NotFoundException('Rujukan tidak ditemukan');
    const buffer = await buildPdf((doc) => {
      drawLetterhead(doc, 'SURAT RUJUKAN PASIEN');
      doc.font('Helvetica').fontSize(10).fillColor(VITA_BRAND.colors.slate);
      doc.text(`Nomor: ${ref.code}`, { align: 'center' });
      doc.moveDown(1);

      doc.text('Dengan hormat, bersama surat ini kami merujuk pasien berikut untuk penanganan lebih lanjut:');
      doc.moveDown(0.6);

      kvRow(doc, 'Nama Pasien', ref.patientName);
      kvRow(doc, 'Dirujuk ke', ref.toHospital);
      kvRow(doc, 'Tingkat Urgensi', URGENCY_LABEL[ref.urgency] ?? ref.urgency);
      kvRow(doc, 'Status', ref.status);
      if (ref.booking) kvRow(doc, 'Ref. Kunjungan', ref.booking.code);
      kvRow(doc, 'Tanggal Rujukan', tanggalIndo(ref.createdAt));

      sectionTitle(doc, 'Alasan / Indikasi Rujukan');
      doc.font('Helvetica').fontSize(10).fillColor(VITA_BRAND.colors.slate).text(ref.reason, { align: 'justify' });
      if (ref.note) {
        sectionTitle(doc, 'Catatan');
        doc.font('Helvetica').fontSize(10).text(ref.note, { align: 'justify' });
      }

      doc.moveDown(1);
      doc.font('Helvetica').fontSize(10).text('Demikian surat rujukan ini dibuat. Atas perhatian dan kerja samanya kami ucapkan terima kasih.', { align: 'justify' });

      signatureBlock(doc, 'Petugas Medis / Koordinator');
    });
    return { buffer, code: ref.code };
  }

  // ============ Excel: Register Risiko ============
  async risksXlsx(): Promise<Buffer> {
    const data = await this.prisma.riskRegister.findMany({ orderBy: { score: 'desc' }, include: { owner: true } });
    const wb = new ExcelJS.Workbook();
    wb.creator = VITA_BRAND.name;
    wb.created = new Date();
    const ws = wb.addWorksheet('Register Risiko');

    ws.mergeCells('A1:J1');
    ws.getCell('A1').value = `${VITA_BRAND.name} — Register Risiko`;
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF075F47' } };
    ws.mergeCells('A2:J2');
    ws.getCell('A2').value = `Dicetak: ${tanggalIndo()} · ${VITA_BRAND.coverage}`;
    ws.getCell('A2').font = { size: 9, color: { argb: 'FF64748B' } };

    const header = ['Kode', 'Judul', 'Kategori', 'Probability', 'Impact', 'Skor', 'Level', 'Status', 'Owner', 'Mitigasi'];
    const headerRow = ws.addRow([]);
    headerRow.values = header;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B7A5B' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle' };
    });

    const levelColor: Record<string, string> = {
      LOW: 'FFD1FAE5', MEDIUM: 'FFFEF3C7', HIGH: 'FFFFE4E6', CRITICAL: 'FFFECACA',
    };
    for (const r of data) {
      const row = ws.addRow([r.code, r.title, r.category, r.probability, r.impact, r.score, r.level, r.status, r.owner?.name ?? '', r.mitigation ?? '']);
      const lvlCell = row.getCell(7);
      lvlCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: levelColor[r.level] ?? 'FFFFFFFF' } };
      lvlCell.font = { bold: true };
    }
    ws.columns.forEach((col, i) => {
      col.width = [12, 30, 16, 12, 10, 8, 10, 12, 18, 40][i] ?? 14;
    });
    ws.views = [{ state: 'frozen', ySplit: 3 }];

    const out = await wb.xlsx.writeBuffer();
    return Buffer.from(out);
  }

  async findingsCsv(): Promise<string> {
    const data = await this.prisma.finding.findMany({
      orderBy: { createdAt: 'desc' },
      include: { pic: true, capa: true },
    });
    return toCsv(
      ['Kode', 'Deskripsi', 'Kategori', 'Probability', 'Impact', 'Level Risiko', 'PIC', 'Deadline', 'Status CAPA'],
      data.map((f) => [
        f.code, f.description, f.category, f.probability, f.impact, f.riskLevel,
        f.pic?.name ?? '', f.deadline?.toISOString().slice(0, 10) ?? '', f.capa?.status ?? 'Belum ada',
      ]),
    );
  }

  async invoicesCsv(): Promise<string> {
    const data = await this.prisma.invoice.findMany({ orderBy: { issuedAt: 'desc' } });
    return toCsv(
      ['Kode', 'Pasien', 'Subtotal', 'Pajak', 'Total', 'Status', 'Diterbitkan', 'Dibayar'],
      data.map((i) => [
        i.code, i.patientName, i.subtotal, i.tax, i.total, i.status,
        i.issuedAt.toISOString().slice(0, 10), i.paidAt?.toISOString().slice(0, 10) ?? '',
      ]),
    );
  }

  async risksCsv(): Promise<string> {
    const data = await this.prisma.riskRegister.findMany({ orderBy: { score: 'desc' }, include: { owner: true } });
    return toCsv(
      ['Kode', 'Judul', 'Kategori', 'Probability', 'Impact', 'Skor', 'Level', 'Status', 'Owner', 'Mitigasi'],
      data.map((r) => [
        r.code, r.title, r.category, r.probability, r.impact, r.score, r.level, r.status,
        r.owner?.name ?? '', r.mitigation ?? '',
      ]),
    );
  }
}
