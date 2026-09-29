import {
  Controller,
  ForbiddenException,
  Get,
  Req,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { CapaService } from "../capa/capa.service";
import { HaHService } from "../hah/hah.service";
import { NotificationService } from "../notification/notification.service";

@Controller("cron")
export class ServerlessCronController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly hah: HaHService,
    private readonly capa: CapaService,
  ) {}

  private authorize(request: Request) {
    const secret = process.env.CRON_SECRET?.trim();
    const supplied = request.headers.authorization ?? "";
    if (!secret) throw new ForbiddenException("CRON_SECRET belum dikonfigurasi");
    const expected = `Bearer ${secret}`;
    const actualBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    )
      throw new ForbiddenException("Cron tidak terotorisasi");
  }

  @Get("clinical-minute")
  async clinicalMinute(@Req() request: Request) {
    this.authorize(request);
    const deliveryIds = await this.notifications.reconcileDue();
    const deliveries = await Promise.allSettled(
      deliveryIds.map((id) => this.notifications.processDelivery(id)),
    );
    const [alerts, medications] = await Promise.all([
      this.hah.escalateOverdueAlerts(),
      this.hah.processMedicationSchedules(),
    ]);
    return {
      ok: true,
      notifications: {
        due: deliveryIds.length,
        processed: deliveries.filter((result) => result.status === "fulfilled")
          .length,
        failed: deliveries.filter((result) => result.status === "rejected")
          .length,
      },
      alerts,
      medications,
    };
  }

  @Get("capa-daily")
  async capaDaily(@Req() request: Request) {
    this.authorize(request);
    return { ok: true, ...(await this.capa.runDailyReminders()) };
  }
}