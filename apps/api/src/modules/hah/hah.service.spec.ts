import { BadRequestException } from "@nestjs/common";
import { HaHEpisodeStatus } from "@prisma/client";
import { HaHService } from "./hah.service";

describe("HaHService discharge safety", () => {
  function serviceWith(prisma: any) {
    return new HaHService(prisma, {} as any);
  }

  it("merangkum seluruh blocker discharge", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "episode-1", status: HaHEpisodeStatus.ACTIVE }),
      },
      clinicalAlert: { count: jest.fn().mockResolvedValue(2) },
      haHDiagnosticOrder: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1),
      },
    };

    const readiness = await serviceWith(prisma).dischargeReadiness("episode-1");

    expect(readiness.ready).toBe(false);
    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/2 alert klinis/i),
        expect.stringMatching(/1 pemeriksaan diagnostik/i),
        expect.stringMatching(/1 hasil kritis/i),
      ]),
    );
  });

  it("menolak discharge aktif tanpa evaluasi DISCHARGE_READY terbaru", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "episode-1", status: HaHEpisodeStatus.ACTIVE }),
      },
      clinicalAlert: { count: jest.fn().mockResolvedValue(0) },
      haHDiagnosticOrder: { count: jest.fn().mockResolvedValue(0) },
      haHClinicalEvaluation: { findFirst: jest.fn().mockResolvedValue(null) },
      haHCarePlan: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ updatedAt: new Date("2026-09-29T00:00:00Z") }),
      },
    };

    await expect(
      serviceWith(prisma).discharge(
        "episode-1",
        {
          dischargeDisposition: "Rumah",
          dischargeSummary:
            "Pasien stabil dan telah menerima instruksi tindak lanjut lengkap.",
        },
        "doctor-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.haHEpisode.update).toBeUndefined();
  });
});

describe("HaHService medication adherence", () => {
  it("memperbarui dosis terjadwal tanpa membuat catatan duplikat", async () => {
    const planned = {
      id: "dose-1",
      medicationOrderId: "med-1",
      scheduledAt: new Date("2026-09-29T08:00:00Z"),
      status: "PLANNED",
    };
    const prisma: any = {
      medicationOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: "med-1",
          episodeId: "episode-1",
          status: "ACTIVE",
        }),
      },
      medicationAdministration: {
        findFirst: jest.fn().mockResolvedValue(planned),
        update: jest.fn().mockResolvedValue({ ...planned, status: "GIVEN" }),
        create: jest.fn(),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new HaHService(prisma, {} as any);

    await service.administerMedication(
      "med-1",
      {
        scheduledAt: "2026-09-29T08:00:00Z",
        administeredAt: "2026-09-29T08:02:00Z",
        status: "GIVEN",
      },
      "nurse-1",
    );

    expect(prisma.medicationAdministration.update).toHaveBeenCalled();
    expect(prisma.medicationAdministration.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("mengklaim reminder dan menandai dosis terlambat secara idempoten", async () => {
    const episode = {
      id: "episode-1",
      code: "HAH-1",
      patient: { fullName: "Pasien Uji", portalUserId: "patient-1" },
    };
    const order = {
      id: "med-1",
      episodeId: "episode-1",
      medicationName: "Obat Uji",
      dose: "1 tablet",
      episode,
    };
    const reminder = {
      id: "dose-reminder",
      medicationOrderId: "med-1",
      scheduledAt: new Date("2026-09-29T08:20:00Z"),
      medicationOrder: order,
    };
    const overdue = {
      ...reminder,
      id: "dose-missed",
      scheduledAt: new Date("2026-09-29T06:00:00Z"),
    };
    const prisma: any = {
      medicationAdministration: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([reminder])
          .mockResolvedValueOnce([overdue]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = {
      enqueue: jest.fn().mockResolvedValue({}),
      enqueueClinical: jest.fn().mockResolvedValue([]),
    };

    const result = await new HaHService(prisma, notify as any).processMedicationSchedules(
      new Date("2026-09-29T08:00:00Z"),
    );

    expect(result).toEqual({ reminded: 1, missed: 1 });
    expect(notify.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ to: "patient-1", title: "Pengingat obat" }),
    );
    expect(notify.enqueueClinical).toHaveBeenCalled();
  });
});

describe("HaHService emergency response", () => {
  it("mencatat tindakan darurat, audit, dan notifikasi klinis", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-1",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      haHEmergencyEvent: {
        create: jest.fn().mockResolvedValue({
          id: "emergency-1",
          episodeId: "episode-1",
          action: "AMBULANCE",
          latitude: -8.58,
          longitude: 116.1,
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueueClinical: jest.fn().mockResolvedValue([]) };

    const event = await new HaHService(
      prisma,
      notify as any,
    ).createEmergencyEvent(
      "episode-1",
      { action: "AMBULANCE", latitude: -8.58, longitude: 116.1 },
      "patient-1",
    );

    expect(event.id).toBe("emergency-1");
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(notify.enqueueClinical).toHaveBeenCalledWith(
      expect.stringMatching(/DARURAT/),
      expect.stringMatching(/HAH-1/),
    );
  });

  it("menolak koordinat darurat yang tidak lengkap", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-1",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
    };

    await expect(
      new HaHService(prisma, {} as any).createEmergencyEvent(
        "episode-1",
        { action: "LOCATION_SHARED", latitude: -8.58 },
        "patient-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("HaHService caregiver privacy", () => {
  it("mewajibkan scope SUMMARY pada consent caregiver", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          patientId: "patient-1",
        }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "caregiver-1",
          role: "CAREGIVER",
          isActive: true,
        }),
      },
    };

    await expect(
      new HaHService(prisma, {} as any).grantCaregiverAccess(
        "episode-1",
        {
          caregiverEmail: "caregiver@example.test",
          scope: ["VITALS"],
          consentBy: "Pasien Uji",
          consentAt: "2026-09-28T00:00:00Z",
        },
        "patient-user",
      ),
    ).rejects.toThrow(/SUMMARY/);
  });

  it("meredaksi data di luar scope caregiver", async () => {
    const result: any = {
      id: "episode-1",
      patientId: "patient-1",
      patient: {
        portalUserId: "patient-user",
        nationalId: "SECRET-ID",
      },
      observations: [{ id: "obs-1" }],
      alerts: [{ id: "alert-1" }],
      eligibility: { id: "eligibility-1" },
      carePlan: { id: "plan-1" },
      carePlanRevisions: [{ id: "revision-1" }],
      clinicalEvaluations: [{ id: "evaluation-1" }],
      transfers: [],
      equipmentAssignments: [],
      medicationOrders: [{ id: "med-1" }],
      diagnosticOrders: [{ id: "lab-1" }],
      visits: [{ id: "visit-1" }],
      messages: [{ id: "message-1" }],
      emergencyEvents: [{ id: "emergency-1" }],
    };
    const prisma: any = {
      haHEpisode: { findFirstOrThrow: jest.fn().mockResolvedValue(result) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      haHCaregiverAccess: {
        findFirst: jest.fn().mockResolvedValue({
          scope: ["SUMMARY", "SCHEDULE"],
          consentAt: new Date("2026-09-28T00:00:00Z"),
          expiresAt: null,
        }),
      },
    };

    const visible: any = await new HaHService(prisma, {} as any).getEpisode(
      "episode-1",
      { id: "caregiver-1", role: "CAREGIVER", roles: ["CAREGIVER"] } as any,
    );

    expect(visible.patient.nationalId).toBeNull();
    expect(visible.visits).toHaveLength(1);
    expect(visible.observations).toEqual([]);
    expect(visible.medicationOrders).toEqual([]);
    expect(visible.messages).toEqual([]);
    expect(visible.emergencyEvents).toEqual([]);
  });
});