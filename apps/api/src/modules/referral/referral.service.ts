import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReferralStatus, ReferralUrgency } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReferralDto } from './dto/create-referral.dto';

/** Transisi status rujukan yang diizinkan. */
export const REFERRAL_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

export function canTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return REFERRAL_TRANSITIONS[from]?.includes(to) ?? false;
}

@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationService,
  ) {}

  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.referral.count({ where: { createdAt: { gte: start } } });
    return `RJ-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateReferralDto) {
    const code = await this.generateCode();
    const referral = await this.prisma.referral.create({
      data: {
        code,
        patientName: dto.patientName,
        bookingId: dto.bookingId,
        toHospital: dto.toHospital,
        reason: dto.reason,
        urgency: dto.urgency ?? ReferralUrgency.ROUTINE,
        status: ReferralStatus.REQUESTED,
      },
    });

    if (referral.urgency === ReferralUrgency.EMERGENCY) {
      await this.notify.send({
        channel: 'whatsapp',
        title: 'Rujukan DARURAT',
        body: `Rujukan ${referral.code} (${referral.patientName}) ke ${referral.toHospital} berstatus DARURAT. Mohon segera ditindaklanjuti.`,
      });
    }
    return referral;
  }

  async setStatus(id: string, to: ReferralStatus, note?: string) {
    const ref = await this.prisma.referral.findUnique({ where: { id } });
    if (!ref) throw new NotFoundException('Rujukan tidak ditemukan');
    if (!canTransition(ref.status, to)) {
      throw new BadRequestException(`Transisi ${ref.status} → ${to} tidak diizinkan`);
    }
    return this.prisma.referral.update({ where: { id }, data: { status: to, note } });
  }

  findAll() {
    return this.prisma.referral.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.referral.findUniqueOrThrow({ where: { id }, include: { booking: true } });
  }
}
