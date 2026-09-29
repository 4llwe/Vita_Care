import { ForbiddenException } from "@nestjs/common";
import { ServerlessCronController } from "./serverless-cron.controller";

describe("ServerlessCronController", () => {
  const request = (authorization?: string) =>
    ({ headers: { authorization } }) as any;

  beforeEach(() => {
    process.env.CRON_SECRET = "x".repeat(40);
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("menolak pemanggilan tanpa bearer secret", async () => {
    const controller = new ServerlessCronController(
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(controller.clinicalMinute(request())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("menjalankan delivery, alert, dan medication schedule secara langsung", async () => {
    const notifications = {
      reconcileDue: jest.fn().mockResolvedValue(["delivery-1"]),
      processDelivery: jest.fn().mockResolvedValue({ delivered: true }),
    };
    const hah = {
      escalateOverdueAlerts: jest.fn().mockResolvedValue({ escalated: 1 }),
      processMedicationSchedules: jest
        .fn()
        .mockResolvedValue({ reminded: 2, missed: 0 }),
    };
    const controller = new ServerlessCronController(
      notifications as any,
      hah as any,
      {} as any,
    );
    const result = await controller.clinicalMinute(
      request(`Bearer ${process.env.CRON_SECRET}`),
    );
    expect(result.notifications).toEqual({
      due: 1,
      processed: 1,
      failed: 0,
    });
    expect(hah.escalateOverdueAlerts).toHaveBeenCalled();
    expect(hah.processMedicationSchedules).toHaveBeenCalled();
  });
});