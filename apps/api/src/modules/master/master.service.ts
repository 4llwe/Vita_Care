import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateServiceDto, UpdateServiceDto } from "./dto/service.dto";
import { CreateTariffDto, UpdateTariffDto } from "./dto/tariff.dto";
import {
  CreateHealthWorkerDto,
  UpdateHealthWorkerDto,
} from "./dto/health-worker.dto";

/** Zona layanan Vita Care (NTB). */
export const ZONES = ["Mataram", "Lombok Barat", "Lombok Tengah"] as const;

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- READ-ONLY (dropdown frontend) ----------
  listServices() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { tariffs: true },
    });
  }

  listZones() {
    return ZONES.map((name) => ({ name }));
  }

  listHealthWorkers() {
    return this.prisma.healthWorker.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  // ---------- ADMIN: LAYANAN ----------
  /** Semua layanan termasuk nonaktif, plus jumlah pemesanan terkait. */
  listAllServices() {
    return this.prisma.service.findMany({
      orderBy: { name: "asc" },
      include: { tariffs: true, _count: { select: { bookings: true } } },
    });
  }

  async createService(dto: CreateServiceDto) {
    try {
      return await this.prisma.service.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          category: dto.category.trim(),
          durationMin: dto.durationMin,
          isActive: dto.isActive ?? true,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new BadRequestException(
          `Kode layanan "${dto.code}" sudah dipakai`,
        );
      }
      throw e;
    }
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    await this.getService(id);
    try {
      return await this.prisma.service.update({
        where: { id },
        data: {
          ...(dto.code !== undefined
            ? { code: dto.code.trim().toUpperCase() }
            : {}),
          ...(dto.userId !== undefined ? { userId: dto.userId } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.category !== undefined
            ? { category: dto.category.trim() }
            : {}),
          ...(dto.durationMin !== undefined
            ? { durationMin: dto.durationMin }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new BadRequestException(
          `Kode layanan "${dto.code}" sudah dipakai`,
        );
      }
      throw e;
    }
  }

  /** Nonaktifkan layanan (soft delete) bila ada riwayat pemesanan; hapus permanen bila belum pernah dipakai. */
  async removeService(id: string) {
    const svc = await this.prisma.service.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!svc) throw new NotFoundException("Layanan tidak ditemukan");
    if (svc._count.bookings > 0) {
      return this.prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
    }
    await this.prisma.tariff.deleteMany({ where: { serviceId: id } });
    return this.prisma.service.delete({ where: { id } });
  }

  private async getService(id: string) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException("Layanan tidak ditemukan");
    return svc;
  }

  // ---------- ADMIN: TARIF ----------
  async createTariff(dto: CreateTariffDto) {
    await this.getService(dto.serviceId);
    return this.prisma.tariff.create({
      data: {
        serviceId: dto.serviceId,
        name: dto.name.trim(),
        basePrice: dto.basePrice,
        unit: dto.unit?.trim() || "per kunjungan",
      },
    });
  }

  async updateTariff(id: string, dto: UpdateTariffDto) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException("Tarif tidak ditemukan");
    return this.prisma.tariff.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
        ...(dto.unit !== undefined
          ? { unit: dto.unit.trim() || "per kunjungan" }
          : {}),
      },
    });
  }

  async removeTariff(id: string) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException("Tarif tidak ditemukan");
    return this.prisma.tariff.delete({ where: { id } });
  }

  // ---------- ADMIN: TENAGA KESEHATAN ----------
  listAllHealthWorkers() {
    return this.prisma.healthWorker.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { bookings: true } } },
    });
  }

  private validateZone(zone: string) {
    if (!ZONES.includes(zone as (typeof ZONES)[number])) {
      throw new BadRequestException(
        `Zona tidak valid. Pilihan: ${ZONES.join(", ")}`,
      );
    }
  }

  async createHealthWorker(dto: CreateHealthWorkerDto) {
    this.validateZone(dto.zone);
    return this.prisma.healthWorker.create({
      data: {
        userId: dto.userId,
        name: dto.name.trim(),
        profession: dto.profession.trim(),
        licenseNo: dto.licenseNo.trim(),
        licenseValidUntil: new Date(dto.licenseValidUntil),
        zone: dto.zone,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateHealthWorker(id: string, dto: UpdateHealthWorkerDto) {
    const hw = await this.prisma.healthWorker.findUnique({ where: { id } });
    if (!hw) throw new NotFoundException("Tenaga kesehatan tidak ditemukan");
    if (dto.zone !== undefined) this.validateZone(dto.zone);
    return this.prisma.healthWorker.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.profession !== undefined
          ? { profession: dto.profession.trim() }
          : {}),
        ...(dto.licenseNo !== undefined
          ? { licenseNo: dto.licenseNo.trim() }
          : {}),
        ...(dto.licenseValidUntil !== undefined
          ? { licenseValidUntil: new Date(dto.licenseValidUntil) }
          : {}),
        ...(dto.zone !== undefined ? { zone: dto.zone } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  /** Nonaktifkan nakes bila pernah menangani pemesanan; hapus permanen bila belum. */
  async removeHealthWorker(id: string) {
    const hw = await this.prisma.healthWorker.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!hw) throw new NotFoundException("Tenaga kesehatan tidak ditemukan");
    if (hw._count.bookings > 0) {
      return this.prisma.healthWorker.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.healthWorker.delete({ where: { id } });
  }
}
