import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JobQueueService } from '../../common/jobs/job-queue.service';

export type NotifyChannel = 'in-app' | 'email' | 'whatsapp';
export type NotifyPayload = {
  to?: string;
  channel: NotifyChannel;
  title: string;
  body: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: JobQueueService,
  ) {}

  async enqueue(payload: NotifyPayload) {
    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        channel: payload.channel,
        to: payload.to,
        title: payload.title,
        body: payload.body,
        nextAttemptAt: new Date(),
      },
    });
    await this.queue.enqueueDeliveryBestEffort(delivery.id);
    return delivery;
  }

  async enqueueClinical(title: string, body: string) {
    const jobs: NotifyPayload[] = [{ channel: 'in-app', title, body }];
    if (process.env.EMAIL_CLINICAL_TO) {
      jobs.push({ channel: 'email', to: process.env.EMAIL_CLINICAL_TO, title, body });
    }
    if (process.env.WHATSAPP_EMERGENCY_TO) {
      jobs.push({
        channel: 'whatsapp',
        to: process.env.WHATSAPP_EMERGENCY_TO,
        title,
        body,
      });
    }
    return Promise.all(jobs.map((payload) => this.enqueue(payload)));
  }

  async processDelivery(id: string) {
    const claimed = await this.prisma.notificationDelivery.updateMany({
      where: {
        id,
        status: { in: ['PENDING', 'RETRY'] },
        nextAttemptAt: { lte: new Date() },
      },
      data: { status: 'PROCESSING', lockedAt: new Date() },
    });
    if (claimed.count === 0) return { skipped: true };

    const delivery = await this.prisma.notificationDelivery.findUnique({ where: { id } });
    if (!delivery) return { skipped: true };

    try {
      const result = await this.send({
        channel: delivery.channel as NotifyChannel,
        to: delivery.to ?? undefined,
        title: delivery.title,
        body: delivery.body,
      });
      await this.prisma.notificationDelivery.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          attempts: { increment: 1 },
          providerId: result.providerId,
          deliveredAt: new Date(),
          lastError: null,
          lockedAt: null,
        },
      });
      return { delivered: true };
    } catch (error) {
      const attempts = delivery.attempts + 1;
      const failed = attempts >= delivery.maxAttempts;
      await this.prisma.notificationDelivery.update({
        where: { id },
        data: {
          status: failed ? 'FAILED' : 'RETRY',
          attempts,
          lastError: error instanceof Error ? error.message : 'Provider error',
          nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000),
          lockedAt: null,
        },
      });
      if (!failed) throw error;
      return { failed: true };
    }
  }

  async reconcileDue() {
    const staleBefore = new Date(Date.now() - 15 * 60_000);
    await this.prisma.notificationDelivery.updateMany({
      where: { status: 'PROCESSING', lockedAt: { lt: staleBefore } },
      data: {
        status: 'RETRY',
        nextAttemptAt: new Date(),
        lockedAt: null,
        lastError: 'Worker lease expired; delivery dijadwalkan ulang',
      },
    });
    const due = await this.prisma.notificationDelivery.findMany({
      where: { status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: new Date() } },
      orderBy: { nextAttemptAt: 'asc' },
      take: 200,
      select: { id: true },
    });
    return due.map(({ id }) => id);
  }

  async send(payload: NotifyPayload): Promise<{ ok: boolean; providerId?: string }> {
    if (payload.channel === 'in-app') {
      this.logger.log(
        `[in-app] -> ${payload.to ?? 'clinical-command-center'}: ${payload.title}`,
      );
      return { ok: true };
    }
    return payload.channel === 'email'
      ? this.sendEmail(payload)
      : this.sendWhatsApp(payload);
  }

  private async sendEmail(payload: NotifyPayload) {
    const url = process.env.EMAIL_API_URL;
    const token = process.env.EMAIL_API_TOKEN;
    const to = payload.to ?? process.env.EMAIL_CLINICAL_TO;
    if (!url || !token || !to) {
      throw new ServiceUnavailableException('Provider email produksi belum dikonfigurasi');
    }
    return this.postProvider(url, token, {
      to,
      subject: payload.title,
      text: payload.body,
    });
  }

  private async sendWhatsApp(payload: NotifyPayload) {
    const url = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_TOKEN;
    const to = payload.to ?? process.env.WHATSAPP_EMERGENCY_TO;
    if (!url || !token || !to) {
      throw new ServiceUnavailableException('Provider WhatsApp produksi belum dikonfigurasi');
    }
    return this.postProvider(url, token, {
      to,
      title: payload.title,
      body: payload.body,
    });
  }

  private async postProvider(url: string, token: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ServiceUnavailableException(`Provider notifikasi gagal (${response.status})`);
      }
      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        messageId?: string;
      };
      return { ok: true, providerId: data.id ?? data.messageId };
    } finally {
      clearTimeout(timer);
    }
  }
}
