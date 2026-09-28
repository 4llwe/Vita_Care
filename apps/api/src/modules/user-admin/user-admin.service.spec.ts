import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserAdminService } from './user-admin.service';

describe('UserAdminService', () => {
  it('mencegah admin menonaktifkan akun sendiri', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'admin-1', role: Role.SUPER_ADMIN, isActive: true, roleAssignments: [],
        }),
      },
    };
    const service = new UserAdminService(prisma as any);
    await expect(service.update('admin-1', { isActive: false }, 'admin-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('mencabut sesi dan mencatat audit ketika role diubah', async () => {
    const tx = {
      user: { update: jest.fn().mockResolvedValue({ id: 'user-1', name: 'User', email: 'u@test', role: Role.NURSE, isActive: true }) },
      userRole: { deleteMany: jest.fn(), createMany: jest.fn() },
      authSession: { updateMany: jest.fn() },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-1', role: Role.PATIENT, isActive: true, roleAssignments: [] }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new UserAdminService(prisma as any);
    await service.update('user-1', { role: Role.NURSE }, 'admin-1');
    expect(tx.authSession.updateMany).toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'USER_ACCESS_UPDATED' }) }),
    );
  });
});
