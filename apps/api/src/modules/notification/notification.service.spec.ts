import { NotificationService } from './notification.service';

describe('NotificationService durable delivery', () => {
  const queue = {
    enqueueDeliveryBestEffort: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => jest.clearAllMocks());

  it('menyimpan delivery sebelum memasukkannya ke Redis', async () => {
    const prisma = {
      notificationDelivery: {
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
      },
    };
    const service = new NotificationService(prisma as any, queue as any);

    await service.enqueue({ channel: 'in-app', title: 'T', body: 'B' });

    expect(prisma.notificationDelivery.create).toHaveBeenCalled();
    expect(queue.enqueueDeliveryBestEffort).toHaveBeenCalledWith('delivery-1');
  });

  it('melewati job duplikat yang tidak dapat memperoleh lease', async () => {
    const prisma = {
      notificationDelivery: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
    };
    const service = new NotificationService(prisma as any, queue as any);

    await expect(service.processDelivery('delivery-1')).resolves.toEqual({ skipped: true });
    expect(prisma.notificationDelivery.findUnique).not.toHaveBeenCalled();
  });

  it('memulihkan lease PROCESSING yang kedaluwarsa', async () => {
    const prisma = {
      notificationDelivery: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([{ id: 'delivery-1' }]),
      },
    };
    const service = new NotificationService(prisma as any, queue as any);

    await expect(service.reconcileDue()).resolves.toEqual(['delivery-1']);
    expect(prisma.notificationDelivery.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'PROCESSING' }) }),
    );
  });
});
