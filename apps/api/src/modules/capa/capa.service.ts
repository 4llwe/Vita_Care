import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CapaStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCapaDto } from './dto/create-capa.dto';
import { UpdateCapaProgressDto } from './dto/update-capa.dto';

@Injectable()
export class CapaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationService,
  ) {}

  async create(dto: CreateCapaDto) {
    const finding = await this.prisma.finding.findUnique({ where: { id: dto.findingId } });
    if (!finding) throw new NotFoundException('Temuan tidak ditemukan');
    return this.prisma.capa.create({
      data: {
        findingId: dto.findingId,
        actionPlan: dto.actionPlan,
        targetDate: new Date(dto.targetDate),
        picId: dto.picId,
        status: CapaStatus.OPEN,
      },
    });
  }

  /** Update progress; otomatis menandai VERIFIED saat 100% + ada bukti. */
  async updateProgress(id: string, dto: UpdateCapaProgressDto) {
    const capa = await this.prisma.capa.findUnique({ where: { id } });
    if (!capa) throw new NotFoundException('CAPA tidak ditemukan');

    let status: CapaStatus = capa.status;
    if (dto.progress >= 100) {
      if (!dto.evidenceUrl && !capa.evidenceUrl) {
        throw new BadRequestException('Bukti (evidence) wajib untuk menyelesaikan CAPA');
      }
      status = CapaStatus.VERIFIED;
    } else if (dto.progress > 0) {
      status = CapaStatus.IN_PROGRESS;
    }

    return this.prisma.capa.update({
      where: { id },
      data: { progress: dto.progress, evidenceUrl: dto.evidenceUrl ?? capa.evidenceUrl, status },
    });
  }

  /**
   * Cron harian 08:00: ingatkan CAPA yang mendekati deadline (<=3 hari)
   * dan eskalasi CAPA yang terlambat ke atasan.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { timeZone: 'Asia/Makassar' })
  async runDailyReminders() {
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dueSoon = await this.prisma.capa.findMany({
      where: { status: { in: [CapaStatus.OPEN, CapaStatus.IN_PROGRESS] }, targetDate: { gte: now, lte: soon } },
      include: { pic: true, finding: true },
    });
    for (const c of dueSoon) {
      await this.notify.send({
        to: c.pic?.id,
        channel: 'in-app',
        title: 'Pengingat CAPA',
        body: `CAPA untuk temuan ${c.finding.code} jatuh tempo ${c.targetDate.toLocaleDateString('id-ID')}.`,
      });
    }

    const overdue = await this.prisma.capa.findMany({
      where: { status: { in: [CapaStatus.OPEN, CapaStatus.IN_PROGRESS] }, targetDate: { lt: now } },
      include: { pic: true, finding: true },
    });
    for (const c of overdue) {
      await this.prisma.capa.update({ where: { id: c.id }, data: { status: CapaStatus.OVERDUE, escalated: true } });
      await this.notify.send({
        channel: 'email',
        title: 'Eskalasi CAPA Terlambat',
        body: `CAPA temuan ${c.finding.code} TERLAMBAT dan dieskalasi ke manajemen.`,
      });
    }

    return { reminded: dueSoon.length, escalated: overdue.length };
  }

  findAll() {
    return this.prisma.capa.findMany({ orderBy: { targetDate: 'asc' }, include: { finding: true, pic: true } });
  }
}
