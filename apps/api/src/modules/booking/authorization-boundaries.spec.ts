import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { BookingService } from "./booking.service";
import { BillingService } from "../billing/billing.service";
import { MedicalRecordService } from "../medical-record/medical-record.service";

describe("record-level authorization boundaries", () => {
  it("denies a patient reading another patient's booking", async () => {
    const prisma: any = {
      booking: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn() },
    };
    const service = new BookingService(prisma, {} as any);
    await expect(service.myBooking("booking-a", "patient-b")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [{ id: "booking-a" }, { patientUserId: "patient-b" }] },
    }));
  });

  it("denies a health worker changing an unassigned booking", async () => {
    const prisma: any = {
      booking: { findUnique: jest.fn().mockResolvedValue({ id: "booking-a", healthWorkerId: "worker-profile-a", status: BookingStatus.DITUGASKAN }) },
      healthWorker: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new BookingService(prisma, {} as any);
    await expect(service.changeStatus("booking-a", BookingStatus.DALAM_PERJALANAN, { id: "user-worker-b", role: "HEALTH_WORKER" })).rejects.toThrow("Booking tidak ditugaskan kepada Anda");
  });

  it("denies a patient paying another patient's invoice", async () => {
    const prisma: any = {
      invoice: {
        findUnique: jest.fn().mockResolvedValue({ id: "invoice-a", status: "UNPAID", items: [] }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new BillingService(prisma, { createTransaction: jest.fn() } as any, {} as any);
    await expect(service.pay("invoice-a", { id: "patient-b", role: "PATIENT" })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("denies a health worker reading an unassigned medical record", async () => {
    const prisma: any = {
      medicalRecord: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "record-a", bookingId: "booking-a" }) },
      booking: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new MedicalRecordService(prisma);
    await expect(service.findOne("record-a", { id: "worker-b", role: "HEALTH_WORKER" })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
