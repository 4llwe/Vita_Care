import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
@Injectable()
export class HaHAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      user?: { id: string; role: string };
      params?: { id?: string };
      route?: { path?: string };
      method: string;
    }>();
    const user = req.user;
    if (!user || !["PATIENT", "CAREGIVER", "HEALTH_WORKER"].includes(user.role))
      return true;
    const path = String(req.route?.path ?? "");
    if (!req.params?.id) return true;
    let episodeId: string | undefined;
    const id = req.params.id;
    if (path.includes("episodes/:id")) episodeId = id;
    else if (path.includes("alerts/:id"))
      episodeId = (
        await this.prisma.clinicalAlert.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("medications/:id"))
      episodeId = (
        await this.prisma.medicationOrder.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("visits/:id"))
      episodeId = (
        await this.prisma.haHVisit.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("transfers/:id"))
      episodeId = (
        await this.prisma.haHTransfer.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("diagnostics/:id"))
      episodeId = (
        await this.prisma.haHDiagnosticOrder.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("equipment/:id"))
      episodeId = (
        await this.prisma.haHEquipmentAssignment.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    if (!episodeId) throw new ForbiddenException("Resource klinis tidak dapat diakses");
    const episode = await this.prisma.haHEpisode.findFirst({
      where:
        user.role === "PATIENT"
          ? { id: episodeId, patient: { portalUserId: user.id } }
          : user.role === "CAREGIVER"
            ? {
                id: episodeId,
                patient: {
                  caregiverAccesses: {
                    some: {
                      caregiverId: user.id,
                      revokedAt: null,
                      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                    },
                  },
                },
              }
            : {
                id: episodeId,
                OR: [
                  { attendingPhysicianId: user.id },
                  { visits: { some: { healthWorker: { userId: user.id } } } },
                  {
                    breakGlassAccesses: {
                      some: {
                        userId: user.id,
                        revokedAt: null,
                        expiresAt: { gt: new Date() },
                      },
                    },
                  },
                ],
              },
      select: { id: true },
    });
    if (!episode)
      throw new ForbiddenException("Anda tidak memiliki akses aktif ke episode ini");

    // UI navigation is not a security boundary. Enforce clinical scope on the
    // server so a non-doctor cannot prescribe, approve, or discharge by calling
    // the API directly. Existing HEALTH_WORKER roles remain supported.
    if (user.role === "HEALTH_WORKER" && req.method !== "GET") {
      const profile = await this.prisma.healthWorker.findUnique({
        where: { userId: user.id },
        select: { profession: true, isActive: true, licenseValidUntil: true },
      });
      if (!profile || !profile.isActive || profile.licenseValidUntil <= new Date())
        throw new ForbiddenException("Profil atau izin praktik tidak aktif");
      const profession = profile.profession.toLowerCase();
      const isDoctor = profession.includes("dokter");
      const isNurse = profession.includes("perawat") || profession.includes("bidan");
      const doctorOnly = [
        "eligibility",
        "admit",
        "care-plan",
        "alerts/:id/resolve",
        "discharge",
        "diagnostics",
        "diagnostics/:id/result",
        "diagnostics/:id/acknowledge",
        "episodes/:id/medications",
        "medications/:id/status",
      ].some((segment) => path.includes(segment));
      if (doctorOnly && !isDoctor)
        throw new ForbiddenException("Tindakan ini memerlukan kewenangan dokter");
      if (!doctorOnly && !isDoctor && !isNurse)
        throw new ForbiddenException("Tindakan klinis memerlukan kewenangan yang sesuai");
    }
    return true;
  }
}
