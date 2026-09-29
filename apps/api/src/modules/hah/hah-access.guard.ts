import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthActor, actorHasAnyRole, CLINICAL_ROLES } from "../../common/auth/actor";
import {
  caregiverScopeList,
  requiredCaregiverScope,
} from "./caregiver-scope";
@Injectable()
export class HaHAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{
      user?: AuthActor;
      params?: { id?: string };
      route?: { path?: string };
      method: string;
    }>();
    const user = req.user;
    if (!user || !actorHasAnyRole(user, ["PATIENT", "CAREGIVER", ...CLINICAL_ROLES]))
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
    else if (path.includes("pharmacy-fulfillments/:id"))
      episodeId = (
        await this.prisma.medicationFulfillment.findUnique({
          where: { id },
          select: {
            medicationOrder: { select: { episodeId: true } },
          },
        })
      )?.medicationOrder.episodeId;
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
    else if (path.includes("emergency-events/:id"))
      episodeId = (
        await this.prisma.haHEmergencyEvent.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    else if (path.includes("care-assignments/:id"))
      episodeId = (
        await this.prisma.careAssignment.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId ?? undefined;
    else if (path.includes("clinical-tasks/:id"))
      episodeId = (
        await this.prisma.haHClinicalTask.findUnique({
          where: { id },
          select: { episodeId: true },
        })
      )?.episodeId;
    if (!episodeId) throw new ForbiddenException("Resource klinis tidak dapat diakses");
    const isClinical = actorHasAnyRole(user, CLINICAL_ROLES);
    const isPatient = actorHasAnyRole(user, ["PATIENT"]);
    const isCaregiver = actorHasAnyRole(user, ["CAREGIVER"]);
    const personalAccess = [
      ...(isPatient ? [{ patient: { portalUserId: user.id } }] : []),
      ...(isCaregiver
        ? [
            {
              patient: {
                caregiverAccesses: {
                  some: {
                    caregiverId: user.id,
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
              },
            },
          ]
        : []),
    ];
    const episode = await this.prisma.haHEpisode.findFirst({
      where: isClinical
        ? {
            id: episodeId,
            OR: [
              { attendingPhysicianId: user.id },
              { visits: { some: { healthWorker: { userId: user.id } } } },
              {
                careAssignments: {
                  some: {
                    isActive: true,
                    healthWorker: { userId: user.id },
                  },
                },
              },
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
          }
        : personalAccess.length
          ? { id: episodeId, OR: personalAccess }
          : { id: "__no_episode_access__" },
      select: { id: true, patient: { select: { portalUserId: true } } },
    });
    if (!episode)
      throw new ForbiddenException("Anda tidak memiliki akses aktif ke episode ini");
    const caregiverMode =
      !isClinical && isCaregiver && episode.patient.portalUserId !== user.id;
    if (caregiverMode) {
      if (path.includes("caregivers"))
        throw new ForbiddenException(
          "Hanya pasien atau koordinator yang dapat mengelola akses caregiver",
        );
      const grant = await this.prisma.haHCaregiverAccess.findFirst({
        where: {
          caregiverId: user.id,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          patient: { episodes: { some: { id: episodeId } } },
        },
        select: { scope: true },
      });
      const required = requiredCaregiverScope(path);
      if (
        !grant ||
        (required && !caregiverScopeList(grant.scope).includes(required))
      )
        throw new ForbiddenException(
          `Consent caregiver tidak mencakup ${required ?? "akses ini"}`,
        );
    }

    // UI navigation is not a security boundary. Enforce clinical scope on the
    // server so a non-doctor cannot prescribe, approve, or discharge by calling
    // the API directly. Existing HEALTH_WORKER roles remain supported.
    if (isClinical && req.method !== "GET") {
      const profile = await this.prisma.healthWorker.findUnique({
        where: { userId: user.id },
        select: { profession: true, isActive: true, licenseValidUntil: true },
      });
      if (!profile || !profile.isActive || profile.licenseValidUntil <= new Date())
        throw new ForbiddenException("Profil atau izin praktik tidak aktif");
      const profession = profile.profession.toLowerCase();
      const isDoctor = actorHasAnyRole(user, ["DOCTOR"]) || profession.includes("dokter");
      const isNurse = actorHasAnyRole(user, ["NURSE"]) || profession.includes("perawat") || profession.includes("bidan");
      const isDiagnosticProfessional =
        profession.includes("laboratorium") ||
        profession.includes("analis") ||
        profession.includes("patologi");
      const isPharmacyProfessional =
        profession.includes("farmasi") || profession.includes("apoteker");
      const doctorOnly = [
        "eligibility",
        "admit",
        "care-plan",
        "evaluations",
        "alerts/:id/resolve",
        "discharge",
        "episodes/:id/diagnostics",
        "diagnostics/:id/acknowledge",
        "episodes/:id/medications",
        "medications/:id/status",
      ].some((segment) => path.includes(segment));
      if (doctorOnly && !isDoctor)
        throw new ForbiddenException("Tindakan ini memerlukan kewenangan dokter");
      if (
        path.includes("diagnostics/:id/result") &&
        !isDoctor &&
        !isDiagnosticProfessional
      )
        throw new ForbiddenException(
          "Input hasil memerlukan kewenangan dokter atau tenaga laboratorium",
        );
      if (
        !doctorOnly &&
        !isDoctor &&
        !isNurse &&
        !isDiagnosticProfessional &&
        !isPharmacyProfessional
      )
        throw new ForbiddenException("Tindakan klinis memerlukan kewenangan yang sesuai");
    }
    return true;
  }
}
