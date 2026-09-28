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