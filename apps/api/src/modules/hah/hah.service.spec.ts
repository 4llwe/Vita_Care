import { BadRequestException } from "@nestjs/common";
import {
  CareAssignmentType,
  ClinicalTaskStatus,
  DiagnosticOrderStatus,
  HaHEpisodeStatus,
  PharmacyFulfillmentStatus,
  WoundProgress,
  FallRiskLevel,
  NutritionRiskLevel,
} from "@prisma/client";
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

describe("HaHService care-team coordination", () => {
  it("mengganti koordinator secara transaksional dan mencatat audit", async () => {
    const assignment = {
      id: "assignment-1",
      episodeId: "episode-1",
      healthWorkerId: "worker-1",
      type: CareAssignmentType.CARE_COORDINATOR,
    };
    const tx: any = {
      careAssignment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn().mockResolvedValue(assignment),
      },
      haHEpisode: { update: jest.fn() },
    };
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      healthWorker: {
        findUnique: jest.fn().mockResolvedValue({
          id: "worker-1",
          isActive: true,
          licenseValidUntil: new Date("2030-01-01T00:00:00Z"),
          userId: "coordinator-user",
          user: { id: "coordinator-user" },
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const result = await new HaHService(prisma, {} as any).assignCareTeam(
      "episode-1",
      {
        healthWorkerId: "worker-1",
        type: "CARE_COORDINATOR",
        responsibility: "Koordinasi kunjungan dan komunikasi keluarga",
        startsAt: "2026-09-29T08:00:00Z",
      },
      "admin-1",
    );

    expect(result).toEqual(assignment);
    expect(tx.careAssignment.updateMany).toHaveBeenCalled();
    expect(tx.careAssignment.upsert).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("mencegah dokter utama diakhiri tanpa pengganti", async () => {
    const prisma: any = {
      careAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "assignment-1",
          episodeId: "episode-1",
          type: CareAssignmentType.PRIMARY_CLINICIAN,
          isActive: true,
        }),
      },
    };

    await expect(
      new HaHService(prisma, {} as any).endCareAssignment(
        "assignment-1",
        { reason: "Pergantian jadwal" },
        "admin-1",
      ),
    ).rejects.toThrow(/diganti melalui penugasan baru/i);
  });
});

describe("HaHService clinical task workflow", () => {
  it("menolak tugas untuk petugas di luar tim aktif", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      healthWorker: {
        findUnique: jest.fn().mockResolvedValue({
          id: "worker-1",
          isActive: true,
          licenseValidUntil: new Date("2030-01-01T00:00:00Z"),
        }),
      },
      careAssignment: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    await expect(
      new HaHService(prisma, {} as any).createClinicalTask(
        "episode-1",
        {
          title: "Catat tanda vital",
          category: "VITALS",
          priority: "URGENT",
          assignedToHealthWorkerId: "worker-1",
          dueAt: "2030-01-02T00:00:00Z",
        },
        "doctor-1",
      ),
    ).rejects.toThrow(/anggota tim perawatan aktif/i);
  });

  it("mewajibkan hasil dan handover sebelum tugas selesai", async () => {
    const prisma: any = {
      haHClinicalTask: {
        findUnique: jest.fn().mockResolvedValue({
          id: "task-1",
          episodeId: "episode-1",
          status: ClinicalTaskStatus.IN_PROGRESS,
          assignedToHealthWorker: { userId: "nurse-1" },
        }),
      },
    };

    await expect(
      new HaHService(prisma, {} as any).updateClinicalTask(
        "task-1",
        { status: "COMPLETED" },
        { id: "nurse-1", role: "NURSE", roles: ["NURSE"] } as any,
      ),
    ).rejects.toThrow(/hasil tindakan wajib/i);
  });

  it("menyelesaikan tugas petugas yang ditugaskan dan mencatat audit", async () => {
    const prisma: any = {
      haHClinicalTask: {
        findUnique: jest.fn().mockResolvedValue({
          id: "task-1",
          episodeId: "episode-1",
          status: ClinicalTaskStatus.IN_PROGRESS,
          assignedToHealthWorker: { userId: "nurse-1" },
        }),
        update: jest.fn().mockResolvedValue({
          id: "task-1",
          status: ClinicalTaskStatus.COMPLETED,
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const result = await new HaHService(prisma, {} as any).updateClinicalTask(
      "task-1",
      {
        status: "COMPLETED",
        outcomeNote: "Tanda vital stabil.",
        handoverNote: "Lanjutkan monitoring sesuai jadwal.",
      },
      { id: "nurse-1", role: "NURSE", roles: ["NURSE"] } as any,
    );

    expect(result.status).toBe(ClinicalTaskStatus.COMPLETED);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("HaHService diagnostic laboratory workflow", () => {
  it("menerapkan transisi koleksi spesimen dan mencatat audit", async () => {
    const prisma: any = {
      haHDiagnosticOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: "lab-1",
          episodeId: "episode-1",
          status: DiagnosticOrderStatus.ORDERED,
        }),
        update: jest.fn().mockResolvedValue({
          id: "lab-1",
          status: DiagnosticOrderStatus.COLLECTED,
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const result = await new HaHService(
      prisma,
      {} as any,
    ).updateDiagnosticStatus(
      "lab-1",
      { status: "COLLECTED", collectionNote: "Tabung EDTA diterima baik" },
      "nurse-1",
    );

    expect(result.status).toBe(DiagnosticOrderStatus.COLLECTED);
    expect(prisma.haHDiagnosticOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ collectedById: "nurse-1" }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("menolak hasil sebelum spesimen dikoleksi", async () => {
    const prisma: any = {
      haHDiagnosticOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: "lab-1",
          episodeId: "episode-1",
          status: DiagnosticOrderStatus.ORDERED,
          episode: { code: "HAH-001" },
        }),
      },
    };

    await expect(
      new HaHService(prisma, {} as any).resultDiagnostic(
        "lab-1",
        {
          resultFlag: "NORMAL",
          resultText: "Dalam rentang referensi",
          criticalResult: false,
        },
        "lab-user-1",
      ),
    ).rejects.toThrow(/setelah spesimen dikoleksi/i);
  });

  it("membuat alert dan audit untuk hasil kritis", async () => {
    const prisma: any = {
      haHDiagnosticOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: "lab-1",
          episodeId: "episode-1",
          testName: "Kalium",
          status: DiagnosticOrderStatus.PROCESSING,
          episode: { code: "HAH-001" },
        }),
        update: jest.fn().mockResolvedValue({
          id: "lab-1",
          status: DiagnosticOrderStatus.RESULTED,
          criticalResult: true,
        }),
      },
      clinicalAlert: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueue: jest.fn().mockResolvedValue({}) };

    await new HaHService(prisma, notify as any).resultDiagnostic(
      "lab-1",
      {
        resultValue: "6.8",
        resultUnit: "mmol/L",
        referenceRange: "3.5–5.1",
        resultFlag: "HIGH",
        resultText: "Hiperkalemia kritis",
        criticalResult: true,
      },
      "lab-user-1",
    );

    expect(prisma.clinicalAlert.create).toHaveBeenCalled();
    expect(notify.enqueue).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("HaHService pharmacy fulfillment workflow", () => {
  it("menolak refill kedua ketika permintaan masih berjalan", async () => {
    const prisma: any = {
      medicationOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: "med-1",
          episodeId: "episode-1",
          status: "ACTIVE",
          fulfillments: [],
        }),
      },
      medicationFulfillment: {
        findFirst: jest.fn().mockResolvedValue({ id: "fill-open" }),
      },
    };
    await expect(
      new HaHService(prisma, {} as any).requestMedicationFulfillment(
        "med-1",
        { quantity: "30 tablet", deliveryAddress: "Jl. Sehat No. 10, Mataram" },
        "patient-1",
      ),
    ).rejects.toThrow(/masih berjalan/i);
  });

  it("mewajibkan dokter untuk menyetujui refill", async () => {
    const prisma: any = {
      medicationFulfillment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "fill-1",
          medicationOrderId: "med-1",
          status: PharmacyFulfillmentStatus.CLINICAL_REVIEW,
          medicationOrder: { episodeId: "episode-1" },
        }),
      },
    };
    await expect(
      new HaHService(prisma, {} as any).updateMedicationFulfillment(
        "fill-1",
        { status: "APPROVED" },
        { id: "pharmacist-1", role: "HEALTH_WORKER", roles: ["HEALTH_WORKER"] } as any,
      ),
    ).rejects.toThrow(/kewenangan dokter/i);
  });

  it("mencatat pengiriman beserta kurir dan audit", async () => {
    const prisma: any = {
      medicationFulfillment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "fill-1",
          medicationOrderId: "med-1",
          status: PharmacyFulfillmentStatus.PREPARING,
          medicationOrder: { episodeId: "episode-1" },
        }),
        update: jest.fn().mockResolvedValue({
          id: "fill-1",
          status: PharmacyFulfillmentStatus.OUT_FOR_DELIVERY,
          courierName: "Tim Farmasi A",
        }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const result = await new HaHService(
      prisma,
      {} as any,
    ).updateMedicationFulfillment(
      "fill-1",
      { status: "OUT_FOR_DELIVERY", courierName: "Tim Farmasi A" },
      { id: "pharmacist-1", role: "HEALTH_WORKER", roles: ["HEALTH_WORKER"] } as any,
    );
    expect(result.status).toBe(PharmacyFulfillmentStatus.OUT_FOR_DELIVERY);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("HaHService wound-care workflow", () => {
  it("membuat alert ketika luka memburuk", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-001",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      haHWoundAssessment: {
        create: jest.fn().mockResolvedValue({
          id: "wound-1",
          woundLabel: "Tumit kanan",
          progress: WoundProgress.DETERIORATING,
          infectionSigns: true,
        }),
      },
      clinicalAlert: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueue: jest.fn().mockResolvedValue({}) };
    await new HaHService(prisma, notify as any).createWoundAssessment(
      "episode-1",
      {
        woundLabel: "Tumit kanan",
        location: "Tumit",
        woundType: "Tekanan",
        tissueDescription: "Slough meningkat",
        exudate: "Sedang",
        odor: true,
        surroundingSkin: "Eritema",
        painScore: 6,
        infectionSigns: true,
        progress: "DETERIORATING",
        dressing: "Foam antimicrobial",
        nextReviewAt: "2030-01-01T08:00:00Z",
      },
      "nurse-1",
    );
    expect(prisma.clinicalAlert.create).toHaveBeenCalled();
    expect(notify.enqueue).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("HaHService functional rehabilitation workflow", () => {
  it("membuat alert untuk risiko jatuh tinggi", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-001",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      haHFunctionalAssessment: {
        create: jest.fn().mockResolvedValue({
          id: "function-1",
          fallRisk: FallRiskLevel.HIGH,
          adlScore: 35,
          progress: "DECLINING",
        }),
      },
      clinicalAlert: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueue: jest.fn().mockResolvedValue({}) };
    await new HaHService(prisma, notify as any).createFunctionalAssessment(
      "episode-1",
      {
        mobilityLevel: "Bantuan satu orang",
        adlScore: 35,
        fallRisk: "HIGH",
        fallsLast30Days: 1,
        transferAbility: "Butuh bantuan",
        rehabilitationGoals: "Transfer aman ke kursi",
        exercisePlan: "Latihan duduk berdiri terawasi",
        progress: "DECLINING",
        nextReviewAt: "2030-01-01T08:00:00Z",
      },
      "physio-1",
    );
    expect(prisma.clinicalAlert.create).toHaveBeenCalled();
    expect(notify.enqueue).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("HaHService nutrition-care workflow", () => {
  it("menghitung BMI dan membuat alert untuk risiko nutrisi tinggi", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-001",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      haHNutritionAssessment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: "nutrition-1", ...data }),
        ),
      },
      clinicalAlert: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueue: jest.fn().mockResolvedValue({}) };
    const result = await new HaHService(
      prisma,
      notify as any,
    ).createNutritionAssessment(
      "episode-1",
      {
        weightKg: 45,
        heightCm: 170,
        intakePercent: 35,
        appetite: "Menurun",
        swallowingDifficulty: true,
        nauseaVomiting: false,
        nutritionRisk: "HIGH",
        dietPlan: "Diet tinggi energi protein bertahap",
        nextReviewAt: "2030-01-01T08:00:00Z",
      },
      "dietitian-1",
    );
    expect(result.bmi).toBe(15.6);
    expect(result.nutritionRisk).toBe(NutritionRiskLevel.HIGH);
    expect(prisma.clinicalAlert.create).toHaveBeenCalled();
    expect(notify.enqueue).toHaveBeenCalled();
  });
});

describe("HaHService palliative-care workflow", () => {
  it("membuat alert untuk beban gejala berat", async () => {
    const prisma: any = {
      haHEpisode: {
        findUnique: jest.fn().mockResolvedValue({
          id: "episode-1",
          code: "HAH-001",
          status: HaHEpisodeStatus.ACTIVE,
        }),
      },
      haHPalliativeAssessment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: "palliative-1", ...data }),
        ),
      },
      clinicalAlert: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const notify = { enqueue: jest.fn().mockResolvedValue({}) };
    await new HaHService(prisma, notify as any).createPalliativeAssessment(
      "episode-1",
      {
        ppsScore: 40,
        painScore: 8,
        dyspneaScore: 7,
        nauseaScore: 3,
        anxietyScore: 5,
        consciousnessNotes: "Sadar dan dapat berkomunikasi",
        goalsOfCare: "Kenyamanan dan tetap bersama keluarga di rumah",
        preferredPlaceOfCare: "Rumah",
        escalationPreferences: "Hubungi dokter sebelum rujukan kecuali kegawatdaruratan",
        comfortPlan: "Optimalkan kontrol nyeri dan sesak sesuai order dokter",
        nextReviewAt: "2030-01-01T08:00:00Z",
      },
      "doctor-1",
    );
    expect(prisma.clinicalAlert.create).toHaveBeenCalled();
    expect(notify.enqueue).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});