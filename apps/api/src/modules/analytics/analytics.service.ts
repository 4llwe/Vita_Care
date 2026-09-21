import { Injectable } from '@nestjs/common';
import { BookingStatus, CapaStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export type DashboardSummary = {
  bookings: { total: number; aktif: number; selesai: number };
  revenue: { lunas: number; tertunda: number };
  findings: { total: number; perKategori: Record<string, number> };
  capa: { open: number; inProgress: number; verified: number; overdue: number };
  risks: { total: number; tinggi: number };
};

export type MasterAnalytics = {
  summary: {
    totalServices: number;
    activeServices: number;
    totalWorkers: number;
    activeWorkers: number;
    categories: number;
    avgDurationMin: number;
  };
  topServices: Array<{ id: string; code: string; name: string; category: string; bookings: number }>;
  workerUtilization: Array<{
    id: string;
    name: string;
    profession: string;
    zone: string;
    isActive: boolean;
    total: number;
    completed: number;
    active: number;
  }>;
  tariffByCategory: Array<{
    category: string;
    services: number;
    tariffs: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  }>;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(): Promise<DashboardSummary> {
    const [
      totalBookings,
      aktifBookings,
      selesaiBookings,
      paidAgg,
      pendingAgg,
      findingsGroup,
      totalFindings,
      capaOpen,
      capaProgress,
      capaVerified,
      capaOverdue,
      totalRisks,
      highRisks,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: { status: { in: [BookingStatus.DIKONFIRMASI, BookingStatus.DITUGASKAN, BookingStatus.DALAM_PERJALANAN, BookingStatus.BERLANGSUNG] } },
      }),
      this.prisma.booking.count({ where: { status: { in: [BookingStatus.SELESAI, BookingStatus.DIEVALUASI] } } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { status: InvoiceStatus.PAID } }),
      this.prisma.invoice.aggregate({ _sum: { total: true }, where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.UNPAID] } } }),
      this.prisma.finding.groupBy({ by: ['category'], _count: { _all: true } }),
      this.prisma.finding.count(),
      this.prisma.capa.count({ where: { status: CapaStatus.OPEN } }),
      this.prisma.capa.count({ where: { status: CapaStatus.IN_PROGRESS } }),
      this.prisma.capa.count({ where: { status: CapaStatus.VERIFIED } }),
      this.prisma.capa.count({ where: { status: CapaStatus.OVERDUE } }),
      this.prisma.riskRegister.count(),
      this.prisma.riskRegister.count({ where: { level: { in: ['HIGH', 'CRITICAL'] } } }),
    ]);

    const perKategori: Record<string, number> = {};
    for (const g of findingsGroup) perKategori[g.category] = (g as any)._count._all;

    return {
      bookings: { total: totalBookings, aktif: aktifBookings, selesai: selesaiBookings },
      revenue: { lunas: paidAgg._sum.total ?? 0, tertunda: pendingAgg._sum.total ?? 0 },
      findings: { total: totalFindings, perKategori },
      capa: { open: capaOpen, inProgress: capaProgress, verified: capaVerified, overdue: capaOverdue },
      risks: { total: totalRisks, tinggi: highRisks },
    };
  }

  /** Analitik master data: layanan terlaris, utilisasi nakes, tarif rata-rata per kategori. */
  async masterAnalytics(): Promise<MasterAnalytics> {
    const ongoing = [
      BookingStatus.DIKONFIRMASI,
      BookingStatus.DITUGASKAN,
      BookingStatus.DALAM_PERJALANAN,
      BookingStatus.BERLANGSUNG,
    ];
    const done = [BookingStatus.SELESAI, BookingStatus.DIEVALUASI];

    const [services, workers, byService, byWorker] = await Promise.all([
      this.prisma.service.findMany({ include: { tariffs: true } }),
      this.prisma.healthWorker.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.booking.groupBy({
        by: ['serviceId'],
        _count: { _all: true },
        where: { status: { not: BookingStatus.DIBATALKAN } },
      }),
      this.prisma.booking.groupBy({
        by: ['healthWorkerId', 'status'],
        _count: { _all: true },
        where: { healthWorkerId: { not: null } },
      }),
    ]);

    // Layanan terlaris (berdasarkan jumlah pemesanan non-batal).
    const svcMap = new Map(services.map((s) => [s.id, s]));
    const topServices = byService
      .map((b) => {
        const s = svcMap.get(b.serviceId);
        return {
          id: b.serviceId,
          code: s?.code ?? '-',
          name: s?.name ?? 'Layanan',
          category: s?.category ?? '-',
          bookings: b._count._all,
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 8);

    // Utilisasi nakes: total ditangani, selesai, sedang berjalan.
    const util = new Map<string, { total: number; completed: number; active: number }>();
    for (const row of byWorker) {
      const id = row.healthWorkerId as string;
      const cur = util.get(id) ?? { total: 0, completed: 0, active: 0 };
      const n = row._count._all;
      if (row.status !== BookingStatus.DIBATALKAN) cur.total += n;
      if (done.includes(row.status)) cur.completed += n;
      if (ongoing.includes(row.status)) cur.active += n;
      util.set(id, cur);
    }
    const workerUtilization = workers
      .map((w) => {
        const u = util.get(w.id) ?? { total: 0, completed: 0, active: 0 };
        return {
          id: w.id,
          name: w.name,
          profession: w.profession,
          zone: w.zone,
          isActive: w.isActive,
          ...u,
        };
      })
      .sort((a, b) => b.total - a.total);

    // Tarif rata-rata per kategori layanan.
    const catMap = new Map<string, { services: number; prices: number[] }>();
    for (const s of services) {
      const e = catMap.get(s.category) ?? { services: 0, prices: [] };
      e.services += 1;
      for (const t of s.tariffs) e.prices.push(t.basePrice);
      catMap.set(s.category, e);
    }
    const tariffByCategory = [...catMap.entries()]
      .map(([category, v]) => {
        const tariffs = v.prices.length;
        const avgPrice = tariffs ? Math.round(v.prices.reduce((a, b) => a + b, 0) / tariffs) : 0;
        return {
          category,
          services: v.services,
          tariffs,
          avgPrice,
          minPrice: tariffs ? Math.min(...v.prices) : 0,
          maxPrice: tariffs ? Math.max(...v.prices) : 0,
        };
      })
      .sort((a, b) => b.avgPrice - a.avgPrice);

    const activeSvc = services.filter((s) => s.isActive);
    const avgDurationMin = activeSvc.length
      ? Math.round(activeSvc.reduce((a, s) => a + s.durationMin, 0) / activeSvc.length)
      : 0;

    return {
      summary: {
        totalServices: services.length,
        activeServices: activeSvc.length,
        totalWorkers: workers.length,
        activeWorkers: workers.filter((w) => w.isActive).length,
        categories: new Set(services.map((s) => s.category)).size,
        avgDurationMin,
      },
      topServices,
      workerUtilization,
      tariffByCategory,
    };
  }
}
