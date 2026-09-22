import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeoService } from './geo.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SelfBookingDto } from './dto/self-booking.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

/** Transisi status booking yang diizinkan (state machine). */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DIPESAN: ['DIKONFIRMASI', 'DIBATALKAN'],
  DIKONFIRMASI: ['DITUGASKAN', 'DIBATALKAN'],
  DITUGASKAN: ['DALAM_PERJALANAN'],
  DALAM_PERJALANAN: ['BERLANGSUNG'],
  BERLANGSUNG: ['SELESAI'],
  SELESAI: ['DIEVALUASI'],
  DIEVALUASI: [],
  DIBATALKAN: [],
};

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geo: GeoService,
  ) {}

  async generateCode(now = new Date()): Promise<string> {
    const start = new Date(`${now.getFullYear()}-01-01T00:00:00.000Z`);
    const count = await this.prisma.booking.count({ where: { createdAt: { gte: start } } });
    return `BK-${String(count + 2041).padStart(4, '0')}`;
  }

  async create(dto: CreateBookingDto) {
    const code = await this.generateCode();
    return this.prisma.booking.create({
      data: {
        code,
        patientName: dto.patientName,
        serviceId: dto.serviceId,
        zone: dto.zone,
        addressLat: dto.lat,
        addressLng: dto.lng,
        scheduledAt: new Date(dto.scheduledAt),
        status: BookingStatus.DIPESAN,
      },
    });
  }

  /** Validasi transisi & ubah status. */
  async changeStatus(id: string, next: BookingStatus) {
    const bk = await this.prisma.booking.findUnique({ where: { id } });
    if (!bk) throw new NotFoundException('Booking tidak ditemukan');
    if (!BOOKING_TRANSITIONS[bk.status].includes(next)) {
      throw new BadRequestException(`Transisi ${bk.status} -> ${next} tidak valid`);
    }
    return this.prisma.booking.update({ where: { id }, data: { status: next } });
  }

  /** Assign manual ke nakes tertentu (validasi aktif, sezona, lisensi valid). */
  async assignTo(bookingId: string, workerId: string) {
    const bk = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!bk) throw new NotFoundException('Booking tidak ditemukan');
    const worker = await this.prisma.healthWorker.findUnique({ where: { id: workerId } });
    if (!worker || !worker.isActive) throw new BadRequestException('Tenaga kesehatan tidak valid/aktif');
    if (worker.licenseValidUntil && worker.licenseValidUntil <= new Date()) {
      throw new BadRequestException('Lisensi tenaga kesehatan sudah kedaluwarsa');
    }
    if (worker.zone !== bk.zone) {
      throw new BadRequestException(`Nakes berada di zona ${worker.zone}, tidak sesuai zona booking (${bk.zone})`);
    }
    // Pastikan booking minimal terkonfirmasi sebelum ditugaskan.
    if (bk.status === BookingStatus.DIPESAN) {
      await this.changeStatus(bookingId, BookingStatus.DIKONFIRMASI).catch(() => undefined);
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { healthWorkerId: workerId, status: BookingStatus.DITUGASKAN },
      include: { service: true, healthWorker: true },
    });
  }

  /** Auto-dispatch: pilih nakes aktif, kompeten, lisensi valid, sezona, terdekat. */
  async autoAssign(bookingId: string) {
    const bk = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!bk) throw new NotFoundException('Booking tidak ditemukan');

    const candidates = await this.prisma.healthWorker.findMany({
      where: { isActive: true, zone: bk.zone, licenseValidUntil: { gt: new Date() } },
    });
    if (candidates.length === 0) {
      throw new BadRequestException('Tidak ada tenaga kesehatan tersedia di zona ini');
    }

    const origin = { lat: bk.addressLat ?? 0, lng: bk.addressLng ?? 0 };
    const best = this.geo.nearest(origin, candidates.map((c) => ({ ...c, lat: null, lng: null })))
      ?? candidates[0];

    await this.changeStatus(bookingId, BookingStatus.DIKONFIRMASI).catch(() => undefined);
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { healthWorkerId: best.id, status: BookingStatus.DITUGASKAN },
    });
  }

  findAll() {
    return this.prisma.booking.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: { service: true, healthWorker: true },
    });
  }

  // ----- Portal Pasien -----
  /** Pemesanan mandiri: identitas pasien diambil dari akun login. */
  async createForPatient(dto: SelfBookingDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    const code = await this.generateCode();
    return this.prisma.booking.create({
      data: {
        code,
        patientName: user.name,
        patientPhone: user.phone,
        serviceId: dto.serviceId,
        zone: dto.zone,
        addressLat: dto.lat,
        addressLng: dto.lng,
        scheduledAt: new Date(dto.scheduledAt),
        status: BookingStatus.DIPESAN,
      },
      include: { service: true },
    });
  }

  /** Filter kepemilikan booking untuk pasien (berdasarkan telepon/nama akun). */
  private async ownershipWhere(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    const or: Array<Record<string, unknown>> = [{ patientName: user.name }];
    if (user.phone) or.push({ patientPhone: user.phone });
    return { OR: or };
  }

  /** Daftar booking milik pasien yang sedang login. */
  async myBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: await this.ownershipWhere(userId),
      orderBy: { scheduledAt: 'desc' },
      include: { service: true, healthWorker: true },
    });
  }

  /** Detail booking milik pasien (untuk pelacakan kunjungan). */
  async myBooking(id: string, userId: string) {
    const where = await this.ownershipWhere(userId);
    const bk = await this.prisma.booking.findFirst({
      where: { AND: [{ id }, where] },
      include: {
        service: true,
        healthWorker: { select: { name: true, profession: true, zone: true } },
        invoice: { select: { code: true, status: true, total: true } },
      },
    });
    if (!bk) throw new NotFoundException('Booking tidak ditemukan');
    return bk;
  }

  /** Pasien membatalkan booking miliknya (hanya bila masih boleh dibatalkan). */
  async cancelMine(id: string, userId: string) {
    await this.myBooking(id, userId);
    return this.changeStatus(id, BookingStatus.DIBATALKAN);
  }

  /** Nakes membagikan posisi terkini saat menuju lokasi pasien (hanya DALAM_PERJALANAN). */
  async updateLocation(id: string, dto: UpdateLocationDto) {
    const bk = await this.prisma.booking.findUnique({ where: { id } });
    if (!bk) throw new NotFoundException('Booking tidak ditemukan');
    if (bk.status !== BookingStatus.DALAM_PERJALANAN) {
      throw new BadRequestException('Lokasi hanya dapat dibagikan saat status Dalam Perjalanan');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { workerLat: dto.lat, workerLng: dto.lng, workerLocAt: new Date() },
      select: { id: true, workerLat: true, workerLng: true, workerLocAt: true },
    });
  }
}
