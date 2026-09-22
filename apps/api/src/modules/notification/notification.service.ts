import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { PrismaService } from "../../common/prisma/prisma.service";
export type NotifyChannel = "in-app" | "email" | "whatsapp";
export type NotifyPayload = {
  to?: string;
  channel: NotifyChannel;
  title: string;
  body: string;
};
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(private readonly prisma: PrismaService) {}
  async enqueueClinical(title: string, body: string) {
    const jobs: NotifyPayload[] = [{ channel: "in-app", title, body }];
    if (process.env.EMAIL_CLINICAL_TO)
      jobs.push({ channel: "email", to: process.env.EMAIL_CLINICAL_TO, title, body });
    if (process.env.WHATSAPP_EMERGENCY_TO)
      jobs.push({
        channel: "whatsapp",
        to: process.env.WHATSAPP_EMERGENCY_TO,
        title,
        body,
      });
    return Promise.all(
      jobs.map((p) =>
        this.prisma.notificationDelivery.create({
          data: {
            channel: p.channel,
            to: p.to,
            title: p.title,
            body: p.body,
            nextAttemptAt: new Date(),
          },
        }),
      ),
    );
  }
  @Interval(30000) async retryDue() {
    const jobs = await this.prisma.notificationDelivery.findMany({
      where: { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: new Date() } },
      orderBy: { nextAttemptAt: "asc" },
      take: 50,
    });
    for (const job of jobs) {
      try {
        const result = await this.send({
          channel: job.channel as NotifyChannel,
          to: job.to ?? undefined,
          title: job.title,
          body: job.body,
        });
        await this.prisma.notificationDelivery.update({
          where: { id: job.id },
          data: {
            status: "DELIVERED",
            attempts: { increment: 1 },
            providerId: result.providerId,
            deliveredAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const attempts = job.attempts + 1,
          failed = attempts >= job.maxAttempts;
        await this.prisma.notificationDelivery.update({
          where: { id: job.id },
          data: {
            status: failed ? "FAILED" : "RETRY",
            attempts,
            lastError: error instanceof Error ? error.message : "Provider error",
            nextAttemptAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60000),
          },
        });
      }
    }
  }
  async send(payload: NotifyPayload): Promise<{ ok: boolean; providerId?: string }> {
    if (payload.channel === "in-app") {
      this.logger.log(
        `[in-app] -> ${payload.to ?? "clinical-command-center"}: ${payload.title}`,
      );
      return { ok: true };
    }
    return payload.channel === "email"
      ? this.sendEmail(payload)
      : this.sendWhatsApp(payload);
  }
  private async sendEmail(p: NotifyPayload) {
    const url = process.env.EMAIL_API_URL,
      token = process.env.EMAIL_API_TOKEN,
      to = p.to ?? process.env.EMAIL_CLINICAL_TO;
    if (!url || !token || !to)
      throw new ServiceUnavailableException(
        "Provider email produksi belum dikonfigurasi",
      );
    return this.postProvider(url, token, { to, subject: p.title, text: p.body });
  }
  private async sendWhatsApp(p: NotifyPayload) {
    const url = process.env.WHATSAPP_API_URL,
      token = process.env.WHATSAPP_TOKEN,
      to = p.to ?? process.env.WHATSAPP_EMERGENCY_TO;
    if (!url || !token || !to)
      throw new ServiceUnavailableException(
        "Provider WhatsApp produksi belum dikonfigurasi",
      );
    return this.postProvider(url, token, { to, title: p.title, body: p.body });
  }
  private async postProvider(url: string, token: string, body: Record<string, unknown>) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok)
        throw new ServiceUnavailableException(
          `Provider notifikasi gagal (${res.status})`,
        );
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        messageId?: string;
      };
      return { ok: true, providerId: data.id ?? data.messageId };
    } finally {
      clearTimeout(timer);
    }
  }
}
