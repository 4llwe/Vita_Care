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

  it('dual-writes self booking into canonical patient and appointment', async () => {
    const tx: any = {
      patient: {
        upsert: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
      booking: {
        create: jest.fn().mockResolvedValue({
          id: 'booking-1',
          scheduledAt: new Date('2026-10-01T08:00:00Z'),
        }),
      },
      appointment: {
        create: jest.fn().mockResolvedValue({ id: 'appointment-1' }),
      },
    };
    const prisma: any = {
      booking: { count: jest.fn().mockResolvedValue(0) },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          name: 'Patient One',
          phone: '0800000000',
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const svc = new BookingService(prisma, {} as any);

    await svc.createForPatient({
      serviceId: 'service-1',
      zone: 'Mataram',
      scheduledAt: '2026-10-01T08:00:00Z',
    }, 'user-1');

    expect(tx.patient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'booking-1',
        patientId: 'patient-1',
        serviceId: 'service-1',
      }),
    });
  });
});
