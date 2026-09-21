import { BOOKING_TRANSITIONS, BookingService } from './booking.service';
import { BookingStatus } from '@prisma/client';

describe('BookingService', () => {
  it('mengizinkan transisi valid DIPESAN -> DIKONFIRMASI', () => {
    expect(BOOKING_TRANSITIONS.DIPESAN).toContain('DIKONFIRMASI');
  });

  it('menolak transisi tidak valid', async () => {
    const prisma: any = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({ id: '1', status: BookingStatus.DIPESAN }),
      },
    };
    const svc = new BookingService(prisma, {} as any);
    await expect(svc.changeStatus('1', BookingStatus.SELESAI)).rejects.toThrow(/tidak valid/);
  });

  it('membuat kode booking berurutan', async () => {
    const prisma: any = { booking: { count: jest.fn().mockResolvedValue(0) } };
    const svc = new BookingService(prisma, {} as any);
    expect(await svc.generateCode()).toMatch(/^BK-2041$/);
  });
});
