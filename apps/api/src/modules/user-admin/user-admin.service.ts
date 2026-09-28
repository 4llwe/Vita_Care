import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';

@Injectable()
export class UserAdminService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        roleAssignments: { select: { role: true } },
        healthWorkerProfile: { select: { profession: true, isActive: true } },
      },
    });
  }

  async update(id: string, dto: UpdateUserAdminDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { roleAssignments: { select: { role: true } } },
    });
    if (!existing) throw new NotFoundException('Pengguna tidak ditemukan');
    if (id === actorId && dto.isActive === false) {
      throw new ForbiddenException('Anda tidak dapat menonaktifkan akun sendiri');
    }

    const nextPrimary = dto.role ?? existing.role;
    const nextRoles = dto.roles ?? existing.roleAssignments.map(({ role }) => role);
    const keepsSuperAdmin =
      dto.isActive !== false &&
      (nextPrimary === Role.SUPER_ADMIN || nextRoles.includes(Role.SUPER_ADMIN));
    const wasSuperAdmin =
      existing.role === Role.SUPER_ADMIN ||
      existing.roleAssignments.some(({ role }) => role === Role.SUPER_ADMIN);
    if (wasSuperAdmin && !keepsSuperAdmin) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { role: Role.SUPER_ADMIN },
            { roleAssignments: { some: { role: Role.SUPER_ADMIN } } },
          ],
        },
      });
      if (activeSuperAdmins <= 1) {
        throw new BadRequestException('Minimal satu Super Admin aktif harus dipertahankan');
      }
    }

    const roles = [...new Set([nextPrimary, ...nextRoles])];
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { role: nextPrimary, isActive: dto.isActive ?? existing.isActive },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      if (dto.roles) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: roles.map((role) => ({ userId: id, role })),
          skipDuplicates: true,
        });
      }
      if (dto.role !== undefined || dto.roles !== undefined || dto.isActive === false) {
        await tx.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'ADMIN_ACCESS_CHANGED' },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'USER_ACCESS_UPDATED',
          entity: 'User',
          entityId: id,
          after: { role: nextPrimary, roles, isActive: user.isActive },
        },
      });
      return { ...user, roles };
    });
  }
}
