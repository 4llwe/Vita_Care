import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

function mockPrisma() {
  return {
    booking: { count: jest.fn().mockResolvedValue(2) },
    invoice: { aggregate: jest.fn().mockResolvedValue({ _sum: { total: 500 } }) },
    finding: { groupBy: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    capa: { count: jest.fn().mockResolvedValue(0) },
    riskRegister: { count: jest.fn().mockResolvedValue(0) },
  };
}

describe('AnalyticsService role scoping', () => {
  it('membatasi ringkasan pasien pada booking miliknya dan menyembunyikan keuangan global', async () => {
    const prisma = mockPrisma();
    const service = new AnalyticsService(prisma as any);
    const result = await service.dashboard({ id: 'patient-1', role: Role.PATIENT, roles: [Role.PATIENT] });

    expect(prisma.booking.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ patientUserId: 'patient-1' }) }),
    );
    expect(prisma.invoice.aggregate).not.toHaveBeenCalled();
    expect(result.revenue).toEqual({ lunas: 0, tertunda: 0 });
    expect(result.findings.total).toBe(0);
  });

  it('membatasi ringkasan dokter pada penugasan tenaga kesehatan', async () => {
    const prisma = mockPrisma();
    const service = new AnalyticsService(prisma as any);
    await service.dashboard({ id: 'doctor-1', role: Role.DOCTOR, roles: [Role.DOCTOR] });

    expect(prisma.booking.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          healthWorker: { userId: 'doctor-1', isActive: true },
        }),
      }),
    );
    expect(prisma.invoice.aggregate).not.toHaveBeenCalled();
  });

  it('menampilkan keuangan global hanya untuk role Finance', async () => {
    const prisma = mockPrisma();
    const service = new AnalyticsService(prisma as any);
    const result = await service.dashboard({ id: 'finance-1', role: Role.FINANCE, roles: [Role.FINANCE] });

    expect(prisma.invoice.aggregate).toHaveBeenCalledTimes(2);
    expect(result.revenue.lunas).toBe(500);
  });
});
