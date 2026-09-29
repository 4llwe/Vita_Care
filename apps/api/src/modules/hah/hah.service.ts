import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import {
  Prisma,
  ClinicalAlertSeverity,
  ClinicalAlertStatus,
  CareAssignmentType,
  ClinicalTaskCategory,
  ClinicalTaskPriority,
  ClinicalTaskStatus,
  DiagnosticOrderStatus,
  EquipmentAssignmentStatus,
  EmergencyAction,
  EmergencyEventStatus,
  HaHEvaluationDisposition,
  HaHEligibilityDecision,
  HaHEpisodeStatus,
  HaHVisitStatus,
  MedicationOrderStatus,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuthActor, actorHasAnyRole, CLINICAL_ROLES } from "../../common/auth/actor";
import { NotificationService } from "../notification/notification.service";
import {
  AdministerMedicationDto,
  AssignCareTeamDto,
  ApproveClinicalProtocolDto,
  BreakGlassAccessDto,
  AdmitEpisodeDto,
  AssessEligibilityDto,
  CarePlanDto,
  CreateClinicalTaskDto,
  CreateClinicalEvaluationDto,
  CreateEmergencyEventDto,
  CreateClinicalProtocolDto,
  CreateDiagnosticOrderDto,
  CreateEquipmentAssignmentDto,
  CreateEpisodeDto,
  CreateMedicationOrderDto,
  CreatePatientDto,
  CreateVisitDto,
  DiagnosticResultDto,
  DischargeDto,
  EndCareAssignmentDto,
  GrantCaregiverAccessDto,
  RecordObservationDto,
  SendClinicalMessageDto,
  TransferDto,
  UpdateEquipmentStatusDto,
  UpdateClinicalTaskDto,
  UpdateMedicationStatusDto,
  UpdateVisitStatusDto,
} from "./dto/hah.dto";
import {
  ClinicalProtocolConfig,
  computeHaHClinicalScore,
} from "./clinical-score";
import { validateClinicalProtocol } from "./clinical-protocol.validation";
import { caregiverScopeList } from "./caregiver-scope";

@Injectable()
export class HaHService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationService,
  ) {}

  private async auditClinicalEvent(actorId: string, action: string, entityId: string) {
    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: { actorId, action, entity: "ClinicalAlert", entityId },
      }),
      this.prisma.clinicalAlertEvent.create({
        data: { alertId: entityId, type: action, actorId },
      }),
    ]);
  }

  private async auditEpisodeEvent(
    actorId: string,
    action: string,
    episodeId: string,
    after?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity: "HaHEpisode",
        entityId: episodeId,
        after,
      },
    });
  }

  async activeProtocol() {
    return this.prisma.haHClinicalProtocol.findFirst({
      where: { status: "ACTIVE", activeFrom: { lte: new Date() }, retiredAt: null },
      orderBy: { version: "desc" },
    });
  }

  private async protocolConfig(): Promise<ClinicalProtocolConfig> {
    const row = await this.activeProtocol();
    if (!row) {
      throw new ServiceUnavailableException(
        "Protokol klinis aktif belum disahkan. Observasi otomatis dinonaktifkan.",
      );
    }
    return validateClinicalProtocol(
      row.thresholds as Record<string, unknown>,
      row.responseSla as Record<string, unknown>,
    );
  }

  listProtocols() {
    return this.prisma.haHClinicalProtocol.findMany({
      include: {
        approvals: { include: { approver: { select: { id: true, name: true } } } },
      },
      orderBy: { version: "desc" },
      take: 50,
    });
  }

  async createProtocol(dto: CreateClinicalProtocolDto, actorId: string) {
    validateClinicalProtocol(dto.thresholds, dto.responseSla);
    const latest = await this.prisma.haHClinicalProtocol.aggregate({
      _max: { version: true },
    });
    const protocol = await this.prisma.haHClinicalProtocol.create({
      data: {
        version: (latest._max.version ?? 0) + 1,
        name: dto.name,
        thresholds: dto.thresholds as unknown as Prisma.InputJsonValue,
        responseSla: dto.responseSla as unknown as Prisma.InputJsonValue,
        status: "PENDING_APPROVAL",
        approvedById: actorId,
        approvalNote: dto.approvalNote,
        activeFrom: new Date(dto.activeFrom),
      },
    });
    await this.prisma.haHClinicalProtocolApproval.create({
      data: {
        protocolId: protocol.id,
        approverId: actorId,
        decision: "PROPOSED",
        note: dto.approvalNote,
      },
    });
    return protocol;
  }

  async approveProtocol(id: string, dto: ApproveClinicalProtocolDto, actorId: string) {
    const protocol = await this.prisma.haHClinicalProtocol.findUnique({
      where: { id },
      include: { approvals: true },
    });
    if (!protocol || protocol.status !== "PENDING_APPROVAL")
      throw new BadRequestException("Protokol tidak menunggu persetujuan");
    if (protocol.approvedById === actorId)
      throw new BadRequestException("Pengusul tidak boleh menjadi penyetuju kedua");
    await this.prisma.haHClinicalProtocolApproval.create({
      data: {
        protocolId: id,
        approverId: actorId,
        decision: dto.decision,
        note: dto.note,
      },
    });
    if (dto.decision === "REJECT")
      return this.prisma.haHClinicalProtocol.update({
        where: { id },
        data: { status: "REJECTED", retiredAt: new Date() },
      });
    return this.prisma.$transaction(async (tx) => {
      await tx.haHClinicalProtocol.updateMany({
        where: { status: "ACTIVE", retiredAt: null },
        data: { status: "RETIRED", retiredAt: new Date() },
      });
      return tx.haHClinicalProtocol.update({
        where: { id },
        data: { status: "ACTIVE", approvedAt: new Date() },
      });
    });
  }

  async createBreakGlassAccess(
    episodeId: string,
    dto: BreakGlassAccessDto,
    userId: string,
  ) {
    await this.requireEpisode(episodeId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { healthWorkerProfile: true, roleAssignments: { select: { role: true } } },
    });
    const clinicalUser = !!user && actorHasAnyRole({
      role: user.role, roles: user.roleAssignments.map(({ role }) => role),
    }, CLINICAL_ROLES);
    if (
      !user ||
      !user.isActive ||
      (clinicalUser &&
        (!user.healthWorkerProfile ||
          !user.healthWorkerProfile.isActive ||
          user.healthWorkerProfile.licenseValidUntil <= new Date()))
    )
      throw new BadRequestException("Pengguna tidak memenuhi syarat break-glass");
    const access = await this.prisma.haHBreakGlassAccess.create({
      data: {
        episodeId,
        userId,
        reason: dto.reason,
        expiresAt: new Date(Date.now() + dto.durationMinutes * 60000),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "BREAK_GLASS_GRANTED",
        entity: "HaHEpisode",
        entityId: episodeId,
        after: { reason: dto.reason, expiresAt: access.expiresAt },
      },
    });
    return access;
  }

  private async nextCode(prefix: string, model: "patient" | "episode") {
    const year = new Date().getFullYear();
    const count =
      model === "patient"
        ? await this.prisma.haHPatient.count()
        : await this.prisma.haHEpisode.count({
            where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00Z`) } },
          });
    return `${prefix}-${year}-${String(count + 1).padStart(5, "0")}`;
  }

  async createPatient(dto: CreatePatientDto) {
    const mrn = await this.nextCode("MRN", "patient");
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.patient.findFirst({
        where: {
          OR: [
            ...(dto.portalUserId ? [{ userId: dto.portalUserId }] : []),
            ...(dto.nationalId ? [{ nationalId: dto.nationalId }] : []),
          ],
        },
      });
      const canonical = existing
        ? await tx.patient.update({
            where: { id: existing.id },
            data: {
              fullName: dto.fullName,
              phone: dto.phone,
              dateOfBirth: new Date(dto.dateOfBirth),
              sexAtBirth: dto.sexAtBirth,
              address: dto.address,
              zone: dto.zone,
            },
          })
        : await tx.patient.create({
            data: {
              userId: dto.portalUserId,
              mrn,
              nationalId: dto.nationalId,
              fullName: dto.fullName,
              phone: dto.phone,
              dateOfBirth: new Date(dto.dateOfBirth),
              sexAtBirth: dto.sexAtBirth,
              address: dto.address,
              zone: dto.zone,
            },
          });
      return tx.haHPatient.create({
        data: {
          canonicalPatientId: canonical.id,
          mrn,
          fullName: dto.fullName,
          dateOfBirth: new Date(dto.dateOfBirth),
          sexAtBirth: dto.sexAtBirth,
          nationalId: dto.nationalId,
          portalUserId: dto.portalUserId,
          phone: dto.phone,
          address: dto.address,
          zone: dto.zone,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          allergies: dto.allergies ?? [],
        },
      });
    });
  }

  async createEpisode(dto: CreateEpisodeDto, actorId: string) {
    const patient = await this.prisma.haHPatient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) throw new NotFoundException("Pasien tidak ditemukan");
    const active = await this.prisma.haHEpisode.findFirst({
      where: {
        patientId: dto.patientId,
        status: {
          in: [
            HaHEpisodeStatus.SCREENING,
            HaHEpisodeStatus.ELIGIBLE,
            HaHEpisodeStatus.ADMITTED,
            HaHEpisodeStatus.ACTIVE,
          ],
        },
      },
    });
    if (active)
      throw new BadRequestException(`Pasien masih memiliki episode aktif ${active.code}`);
    const physician = await this.prisma.healthWorker.findUnique({
      where: { userId: dto.attendingPhysicianId },
      select: { id: true },
    });
    return this.prisma.haHEpisode.create({
      data: {
        code: await this.nextCode("HAH", "episode"),
        patientId: dto.patientId,
        admissionSource: dto.admissionSource,
        referringFacility: dto.referringFacility,
        referringClinician: dto.referringClinician,
        attendingPhysicianId: dto.attendingPhysicianId,
        primaryDiagnosis: dto.primaryDiagnosis,
        comorbidities: dto.comorbidities ?? [],
        acuityLevel: dto.acuityLevel ?? "ACUTE_STABLE",
        zone: dto.zone,
        expectedLengthOfStayDays: dto.expectedLengthOfStayDays,
        caregiverName: dto.caregiverName,
        caregiverPhone: dto.caregiverPhone,
        createdById: actorId,
        careAssignments: physician
          ? {
              create: {
                healthWorkerId: physician.id,
                type: CareAssignmentType.PRIMARY_CLINICIAN,
                responsibility: "Dokter penanggung jawab utama",
                startsAt: new Date(),
                assignedById: actorId,
              },
            }
          : undefined,
      },
      include: { patient: true },
    });
  }

  async assessEligibility(id: string, dto: AssessEligibilityDto, actorId: string) {
    const episode = await this.requireEpisode(id);
    if (
      !([HaHEpisodeStatus.SCREENING, HaHEpisodeStatus.INELIGIBLE] as HaHEpisodeStatus[]).includes(episode.status)
    ) {
      throw new BadRequestException(
        "Eligibility hanya dapat dinilai pada tahap screening",
      );
    }
    const exclusions: string[] = [];
    if (!dto.age18OrOlder) exclusions.push("Usia di bawah 18 tahun");
    if (!dto.acuteHospitalLevelNeed)
      exclusions.push("Tidak membutuhkan pelayanan setingkat rawat inap");
    if (!dto.clinicallyStableForHome)
      exclusions.push("Tidak stabil untuk perawatan di rumah");
    if (!dto.noImmediateProcedureNeed)
      exclusions.push("Membutuhkan prosedur segera yang tidak tersedia di rumah");
    if (dto.oxygenRequirementLpm > 2)
      exclusions.push("Kebutuhan oksigen melebihi batas protokol awal 2 L/menit");
    if (!dto.homeEnvironmentSafe) exclusions.push("Lingkungan rumah belum aman");
    if (!dto.withinServiceArea) exclusions.push("Di luar area layanan");
    if (!dto.reliableCommunication) exclusions.push("Komunikasi darurat tidak andal");
    if (!dto.patientConsents) exclusions.push("Pasien tidak memberikan persetujuan");

    let decision: HaHEligibilityDecision = exclusions.length
      ? HaHEligibilityDecision.INELIGIBLE
      : HaHEligibilityDecision.ELIGIBLE;
    if (dto.clinicianOverride) {
      if (
        !dto.patientConsents ||
        !dto.homeEnvironmentSafe ||
        !dto.reliableCommunication
      ) {
        throw new BadRequestException(
          "Persetujuan pasien, keamanan rumah, dan komunikasi darurat tidak dapat dioverride",
        );
      }
      if (!dto.overrideReason)
        throw new BadRequestException("Override klinis wajib disertai alasan");
      decision = HaHEligibilityDecision.OVERRIDE_ELIGIBLE;
    }
    const assessmentData = {
      age18OrOlder: dto.age18OrOlder,
      acuteHospitalLevelNeed: dto.acuteHospitalLevelNeed,
      clinicallyStableForHome: dto.clinicallyStableForHome,
      noImmediateProcedureNeed: dto.noImmediateProcedureNeed,
      oxygenRequirementLpm: dto.oxygenRequirementLpm,
      homeEnvironmentSafe: dto.homeEnvironmentSafe,
      withinServiceArea: dto.withinServiceArea,
      reliableCommunication: dto.reliableCommunication,
      patientConsents: dto.patientConsents,
      caregiverAvailable: dto.caregiverAvailable,
      exclusionReasons: exclusions,
      decision,
      overrideReason: dto.overrideReason,
      assessedById: actorId,
    };
    await this.prisma.$transaction([
      this.prisma.haHEligibilityAssessment.upsert({
        where: { episodeId: id },
        create: { episodeId: id, ...assessmentData },
        update: { ...assessmentData, assessedAt: new Date() },
      }),
      this.prisma.haHEpisode.update({
        where: { id },
        data: {
          status:
            decision === HaHEligibilityDecision.INELIGIBLE
              ? HaHEpisodeStatus.INELIGIBLE
              : HaHEpisodeStatus.ELIGIBLE,
        },
      }),
    ]);
    return this.getEpisode(id);
  }

  async admit(id: string, dto: AdmitEpisodeDto) {
    const episode = await this.requireEpisode(id);
    if (episode.status !== HaHEpisodeStatus.ELIGIBLE)
      throw new BadRequestException("Episode belum dinyatakan eligible");
    if (
      !episode.eligibility ||
      !([
        HaHEligibilityDecision.ELIGIBLE,
        HaHEligibilityDecision.OVERRIDE_ELIGIBLE,
      ] as HaHEligibilityDecision[]).includes(episode.eligibility.decision)
    ) {
      throw new BadRequestException("Assessment eligibility yang sah diperlukan");
    }
    return this.prisma.haHEpisode.update({
      where: { id },
      data: {
        status: HaHEpisodeStatus.ADMITTED,
        admissionAt: new Date(),
        consentAt: new Date(dto.consentAt),
        consentBy: dto.consentBy,
        emergencyPlan: dto.emergencyPlan,
      },
      include: { patient: true, eligibility: true },
    });
  }

  async upsertCarePlan(id: string, dto: CarePlanDto, actorId: string) {
    const e = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Care plan memerlukan episode admitted/active");
    const plan = await this.prisma.haHCarePlan.upsert({
      where: { episodeId: id },
      create: {
        episodeId: id,
        ...dto,
        nextReviewAt: new Date(dto.nextReviewAt),
        approvedById: actorId,
      },
      update: {
        ...dto,
        nextReviewAt: new Date(dto.nextReviewAt),
        approvedById: actorId,
        approvedAt: new Date(),
      },
    });
    const revision = await this.prisma.haHCarePlanRevision.count({
      where: { episodeId: id },
    });
    await this.prisma.haHCarePlanRevision.create({
      data: {
        episodeId: id,
        version: revision + 1,
        snapshot: JSON.parse(JSON.stringify(plan)),
        changedById: actorId,
      },
    });
    if (e.status === HaHEpisodeStatus.ADMITTED)
      await this.prisma.haHEpisode.update({
        where: { id },
        data: { status: HaHEpisodeStatus.ACTIVE },
      });
    return plan;
  }

  async createClinicalEvaluation(
    id: string,
    dto: CreateClinicalEvaluationDto,
    actorId: string,
  ) {
    const episode = await this.requireEpisode(id);
    if (
      !(
        [HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]
      ).includes(episode.status)
    )
      throw new BadRequestException("Evaluasi memerlukan episode admitted/active");
    const carePlan = await this.prisma.haHCarePlan.findUnique({
      where: { episodeId: id },
      select: { id: true },
    });
    if (!carePlan)
      throw new BadRequestException("Rencana perawatan harus tersedia sebelum evaluasi");
    if (dto.disposition === HaHEvaluationDisposition.DISCHARGE_READY) {
      const readiness = await this.dischargeReadiness(id);
      if (!readiness.ready)
        throw new BadRequestException(
          `Belum siap discharge: ${readiness.blockers.join("; ")}`,
        );
    }
    const evaluation = await this.prisma.haHClinicalEvaluation.create({
      data: {
        episodeId: id,
        clinicalSummary: dto.clinicalSummary,
        progressNotes: dto.progressNotes,
        goalsMet: dto.goalsMet,
        unmetGoals: dto.unmetGoals ?? [],
        disposition: dto.disposition as HaHEvaluationDisposition,
        followUpRequired: dto.followUpRequired,
        evaluatedById: actorId,
      },
    });
    await this.auditEpisodeEvent(actorId, "CLINICAL_EVALUATION_CREATED", id, {
      evaluationId: evaluation.id,
      disposition: evaluation.disposition,
    });
    return evaluation;
  }

  async dischargeReadiness(id: string) {
    await this.requireEpisode(id);
    const [openAlerts, pendingDiagnostics, unacknowledgedCriticalResults] =
      await Promise.all([
        this.prisma.clinicalAlert.count({
          where: { episodeId: id, status: { not: ClinicalAlertStatus.RESOLVED } },
        }),
        this.prisma.haHDiagnosticOrder.count({
          where: {
            episodeId: id,
            status: {
              in: [
                DiagnosticOrderStatus.ORDERED,
                DiagnosticOrderStatus.COLLECTED,
                DiagnosticOrderStatus.PROCESSING,
              ],
            },
          },
        }),
        this.prisma.haHDiagnosticOrder.count({
          where: {
            episodeId: id,
            criticalResult: true,
            acknowledgedAt: null,
          },
        }),
      ]);
    const blockers: string[] = [];
    if (openAlerts) blockers.push(`${openAlerts} alert klinis belum selesai`);
    if (pendingDiagnostics)
      blockers.push(`${pendingDiagnostics} pemeriksaan diagnostik masih berjalan`);
    if (unacknowledgedCriticalResults)
      blockers.push(
        `${unacknowledgedCriticalResults} hasil kritis belum diakui dokter`,
      );
    return {
      ready: blockers.length === 0,
      blockers,
      openAlerts,
      pendingDiagnostics,
      unacknowledgedCriticalResults,
    };
  }

  async recordObservation(id: string, dto: RecordObservationDto, actorId: string) {
    const e = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Observasi hanya untuk episode admitted/active");
    if (dto.spo2Scale === 2 && !dto.symptomNotes?.toLowerCase().includes("hypercap")) {
      throw new BadRequestException(
        "SpO2 Scale 2 memerlukan dokumentasi hypercapnic respiratory failure pada catatan",
      );
    }
    const score = computeHaHClinicalScore(dto, await this.protocolConfig());
    const observation = await this.prisma.haHObservation.create({
      data: {
        episodeId: id,
        ...dto,
        ewsScore: score.score,
        ewsRisk: score.risk,
        recordedById: actorId,
      },
    });
    let alert = null;
    if (score.responseMinutes) {
      const severity =
        score.risk === "critical"
          ? ClinicalAlertSeverity.CRITICAL
          : score.risk === "high"
            ? ClinicalAlertSeverity.HIGH
            : ClinicalAlertSeverity.MEDIUM;
      alert = await this.prisma.clinicalAlert.create({
        data: {
          episodeId: id,
          observationId: observation.id,
          severity,
          trigger: `EWS ${score.score}: ${score.triggers.join(", ") || "total score"}`,
          responseDueAt: new Date(Date.now() + score.responseMinutes * 60_000),
        },
      });
      await this.auditClinicalEvent(actorId, "ALERT_CREATED", alert.id);
      await this.notify.enqueueClinical(
        `${severity} clinical alert`,
        `${e.code}: ${alert.trigger}. Respons ≤${score.responseMinutes} menit.`,
      );
    }
    return { observation, alert, responseMinutes: score.responseMinutes };
  }

  async acknowledgeAlert(alertId: string, actorId: string) {
    const a = await this.prisma.clinicalAlert.findUnique({
      where: { id: alertId },
    });
    if (!a) throw new NotFoundException("Alert tidak ditemukan");
    if (a.status !== ClinicalAlertStatus.OPEN)
      throw new BadRequestException("Alert tidak lagi terbuka");
    const alert = await this.prisma.clinicalAlert.update({
      where: { id: alertId },
      data: {
        status: ClinicalAlertStatus.ACKNOWLEDGED,
        acknowledgedById: actorId,
        acknowledgedAt: new Date(),
      },
    });
    await this.auditClinicalEvent(actorId, "ALERT_ACKNOWLEDGED", alertId);
    return alert;
  }

  async resolveAlert(alertId: string, actorId: string, resolution: string) {
    const a = await this.prisma.clinicalAlert.findUnique({
      where: { id: alertId },
    });
    if (!a) throw new NotFoundException("Alert tidak ditemukan");
    if (a.status === ClinicalAlertStatus.RESOLVED)
      throw new BadRequestException("Alert sudah selesai");
    const alert = await this.prisma.clinicalAlert.update({
      where: { id: alertId },
      data: {
        status: ClinicalAlertStatus.RESOLVED,
        resolution,
        resolvedById: actorId,
        resolvedAt: new Date(),
        ...(!a.acknowledgedAt
          ? { acknowledgedById: actorId, acknowledgedAt: new Date() }
          : {}),
      },
    });
    await this.auditClinicalEvent(actorId, "ALERT_RESOLVED", alertId);
    return alert;
  }

  async transfer(id: string, dto: TransferDto, actorId: string) {
    const e = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Episode tidak aktif");
    const [, transfer] = await this.prisma.$transaction([
      this.prisma.haHEpisode.update({
        where: { id },
        data: { status: HaHEpisodeStatus.TRANSFER_REQUESTED },
      }),
      this.prisma.haHTransfer.create({
        data: { episodeId: id, ...dto, requestedById: actorId },
      }),
    ]);
    await this.notify.enqueue({
      channel: "in-app",
      title: `Transfer ${dto.urgency}`,
      body: `${e.code} ke ${dto.destination}: ${dto.reason}`,
    });
    return transfer;
  }

  async completeTransfer(transferId: string) {
    const transfer = await this.prisma.haHTransfer.findUnique({
      where: { id: transferId },
    });
    if (!transfer) throw new NotFoundException("Transfer tidak ditemukan");
    const [, completed] = await this.prisma.$transaction([
      this.prisma.haHEpisode.update({
        where: { id: transfer.episodeId },
        data: { status: HaHEpisodeStatus.TRANSFERRED },
      }),
      this.prisma.haHTransfer.update({
        where: { id: transferId },
        data: { arrivedAt: new Date() },
      }),
    ]);
    return completed;
  }

  async discharge(id: string, dto: DischargeDto, actorId: string) {
    const e = await this.requireEpisode(id);
    const readiness = await this.dischargeReadiness(id);
    if (!readiness.ready)
      throw new BadRequestException(
        `Belum siap discharge: ${readiness.blockers.join("; ")}`,
      );
    if (!([HaHEpisodeStatus.ACTIVE, HaHEpisodeStatus.TRANSFERRED] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Episode belum dapat didischarge");
    if (e.status === HaHEpisodeStatus.ACTIVE) {
      const [evaluation, carePlan] = await Promise.all([
        this.prisma.haHClinicalEvaluation.findFirst({
          where: { episodeId: id },
          orderBy: { evaluatedAt: "desc" },
        }),
        this.prisma.haHCarePlan.findUnique({ where: { episodeId: id } }),
      ]);
      if (
        !evaluation ||
        evaluation.disposition !== HaHEvaluationDisposition.DISCHARGE_READY ||
        (carePlan && evaluation.evaluatedAt < carePlan.updatedAt)
      )
        throw new BadRequestException(
          "Evaluasi dokter DISCHARGE_READY terbaru diperlukan setelah perubahan care plan terakhir",
        );
    }
    const discharged = await this.prisma.haHEpisode.update({
      where: { id },
      data: {
        status: HaHEpisodeStatus.DISCHARGED,
        dischargeAt: new Date(),
        dischargeDisposition: dto.dischargeDisposition,
        dischargeSummary: dto.dischargeSummary,
      },
    });
    await this.auditEpisodeEvent(actorId, "EPISODE_DISCHARGED", id, {
      disposition: dto.dischargeDisposition,
    });
    return discharged;
  }

  async createDiagnosticOrder(
    id: string,
    dto: CreateDiagnosticOrderDto,
    actorId: string,
  ) {
    const e = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Order diagnostik memerlukan episode aktif");
    return this.prisma.haHDiagnosticOrder.create({
      data: { episodeId: id, ...dto, orderedById: actorId },
    });
  }

  async resultDiagnostic(id: string, dto: DiagnosticResultDto) {
    const order = await this.prisma.haHDiagnosticOrder.findUnique({
      where: { id },
      include: { episode: true },
    });
    if (!order) throw new NotFoundException("Order diagnostik tidak ditemukan");
    const result = await this.prisma.haHDiagnosticOrder.update({
      where: { id },
      data: {
        resultText: dto.resultText,
        criticalResult: dto.criticalResult,
        resultedAt: new Date(),
        status: DiagnosticOrderStatus.RESULTED,
      },
    });
    if (dto.criticalResult) {
      await this.prisma.clinicalAlert.create({
        data: {
          episodeId: order.episodeId,
          severity: ClinicalAlertSeverity.CRITICAL,
          trigger: `Critical diagnostic result: ${order.testName}`,
          responseDueAt: new Date(Date.now() + 15 * 60_000),
        },
      });
      await this.notify.enqueue({
        channel: "in-app",
        title: "Critical diagnostic result",
        body: `${order.episode.code}: ${order.testName}`,
      });
    }
    return result;
  }

  async acknowledgeDiagnostic(id: string, actorId: string) {
    const order = await this.prisma.haHDiagnosticOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException("Order diagnostik tidak ditemukan");
    if (!order.resultedAt)
      throw new BadRequestException("Hasil diagnostik belum tersedia");
    return this.prisma.haHDiagnosticOrder.update({
      where: { id },
      data: {
        status: DiagnosticOrderStatus.ACKNOWLEDGED,
        acknowledgedById: actorId,
        acknowledgedAt: new Date(),
      },
    });
  }

  async assignEquipment(id: string, dto: CreateEquipmentAssignmentDto, actorId: string) {
    const e = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Alat hanya dapat ditugaskan ke episode aktif");
    return this.prisma.haHEquipmentAssignment.create({
      data: { episodeId: id, ...dto, requestedById: actorId },
    });
  }

  async updateEquipment(id: string, dto: UpdateEquipmentStatusDto) {
    const item = await this.prisma.haHEquipmentAssignment.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException("Penugasan alat tidak ditemukan");
    const status = dto.status as EquipmentAssignmentStatus;
    return this.prisma.haHEquipmentAssignment.update({
      where: { id },
      data: {
        status,
        ...(status === EquipmentAssignmentStatus.DELIVERED
          ? { deliveredAt: new Date() }
          : {}),
        ...(status === EquipmentAssignmentStatus.RETURNED
          ? { returnedAt: new Date() }
          : {}),
      },
    });
  }

  listPatients(query?: string) {
    return this.prisma.haHPatient.findMany({
      where: query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { mrn: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createMedicationOrder(
    id: string,
    dto: CreateMedicationOrderDto,
    actorId: string,
  ) {
    const episode = await this.getEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(episode.status))
      throw new BadRequestException(
        "Medication order memerlukan episode admitted/active",
      );
    const allergies = Array.isArray(episode.patient.allergies)
      ? episode.patient.allergies.map((x: unknown) => String(x).toLowerCase())
      : [];
    if (
      allergies.some(
        (a: string) =>
          dto.medicationName.toLowerCase().includes(a) ||
          a.includes(dto.medicationName.toLowerCase()),
      )
    )
      throw new BadRequestException(
        "Obat cocok dengan daftar alergi pasien; verifikasi klinis diperlukan",
      );
    const duplicate = await this.prisma.medicationOrder.findFirst({
      where: {
        episodeId: id,
        medicationName: { equals: dto.medicationName, mode: "insensitive" },
        route: dto.route,
        status: MedicationOrderStatus.ACTIVE,
      },
    });
    if (duplicate)
      throw new BadRequestException("Medication order aktif yang sama sudah ada");
    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    const scheduleAt = [
      ...new Set((dto.scheduleAt ?? []).map((value) => new Date(value).toISOString())),
    ].map((value) => new Date(value));
    if (
      scheduleAt.some(
        (value) => value < startAt || (endAt ? value > endAt : false),
      )
    )
      throw new BadRequestException(
        "Jadwal pemberian harus berada dalam periode medication order",
      );
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.medicationOrder.create({
        data: {
          episodeId: id,
          medicationName: dto.medicationName,
          dose: dto.dose,
          route: dto.route,
          frequency: dto.frequency,
          indication: dto.indication,
          startAt,
          endAt,
          prescribedById: actorId,
        },
      });
      if (scheduleAt.length)
        await tx.medicationAdministration.createMany({
          data: scheduleAt.map((scheduledAt) => ({
            medicationOrderId: created.id,
            scheduledById: actorId,
            scheduledAt,
            status: "PLANNED",
          })),
        });
      return tx.medicationOrder.findUniqueOrThrow({
        where: { id: created.id },
        include: { administrations: { orderBy: { scheduledAt: "asc" } } },
      });
    });
    await this.auditEpisodeEvent(actorId, "MEDICATION_ORDER_CREATED", id, {
      medicationOrderId: order.id,
      scheduledDoses: scheduleAt.length,
    });
    return order;
  }

  async updateMedicationStatus(id: string, dto: UpdateMedicationStatusDto) {
    const order = await this.prisma.medicationOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException("Medication order tidak ditemukan");
    return this.prisma.medicationOrder.update({
      where: { id },
      data: { status: dto.status as MedicationOrderStatus },
    });
  }

  async administerMedication(id: string, dto: AdministerMedicationDto, actorId: string) {
    const order = await this.prisma.medicationOrder.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException("Medication order tidak ditemukan");
    if (order.status !== MedicationOrderStatus.ACTIVE)
      throw new BadRequestException("Medication order tidak aktif");
    if (dto.status !== "GIVEN" && !dto.note)
      throw new BadRequestException("Alasan wajib untuk obat yang tidak diberikan");
    const scheduledAt = new Date(dto.scheduledAt);
    const planned = await this.prisma.medicationAdministration.findFirst({
      where: { medicationOrderId: id, scheduledAt },
    });
    if (planned && !["PLANNED", "DELAYED"].includes(planned.status))
      throw new BadRequestException("Dosis terjadwal ini sudah dicatat");
    const administration = planned
      ? await this.prisma.medicationAdministration.update({
          where: { id: planned.id },
          data: {
            administeredById: actorId,
            administeredAt:
              dto.status === "GIVEN"
                ? new Date(dto.administeredAt ?? new Date())
                : undefined,
            status: dto.status,
            note: dto.note,
          },
        })
      : await this.prisma.medicationAdministration.create({
          data: {
            medicationOrderId: id,
            scheduledById: actorId,
            administeredById: actorId,
            scheduledAt,
            administeredAt:
              dto.status === "GIVEN"
                ? new Date(dto.administeredAt ?? new Date())
                : undefined,
            status: dto.status,
            note: dto.note,
          },
        });
    await this.auditEpisodeEvent(
      actorId,
      "MEDICATION_ADMINISTRATION_RECORDED",
      order.episodeId,
      {
        medicationOrderId: id,
        administrationId: administration.id,
        status: administration.status,
      },
    );
    return administration;
  }

  async medicationAdherence(id: string) {
    await this.requireEpisode(id);
    const administrations = await this.prisma.medicationAdministration.findMany({
      where: {
        medicationOrder: { episodeId: id },
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: "desc" },
      take: 500,
      include: {
        medicationOrder: {
          select: { medicationName: true, dose: true, route: true },
        },
      },
    });
    const due = administrations.length;
    const given = administrations.filter((x) => x.status === "GIVEN").length;
    const missed = administrations.filter((x) =>
      ["MISSED", "OMITTED", "REFUSED"].includes(x.status),
    ).length;
    return {
      due,
      given,
      missed,
      pending: administrations.filter((x) =>
        ["PLANNED", "DELAYED"].includes(x.status),
      ).length,
      adherencePercent: due ? Math.round((given / due) * 100) : null,
      administrations,
    };
  }

  async processMedicationSchedules(now = new Date()) {
    const reminderWindow = new Date(now.getTime() + 30 * 60_000);
    const missedBefore = new Date(now.getTime() - 60 * 60_000);
    const [reminders, overdue] = await Promise.all([
      this.prisma.medicationAdministration.findMany({
        where: {
          status: "PLANNED",
          reminderSentAt: null,
          scheduledAt: { gte: now, lte: reminderWindow },
          medicationOrder: {
            status: MedicationOrderStatus.ACTIVE,
            episode: {
              status: { in: [HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] },
            },
          },
        },
        include: {
          medicationOrder: {
            include: { episode: { include: { patient: true } } },
          },
        },
        take: 100,
      }),
      this.prisma.medicationAdministration.findMany({
        where: {
          status: "PLANNED",
          scheduledAt: { lt: missedBefore },
          medicationOrder: {
            status: MedicationOrderStatus.ACTIVE,
            episode: {
              status: { in: [HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] },
            },
          },
        },
        include: {
          medicationOrder: {
            include: { episode: { include: { patient: true } } },
          },
        },
        take: 100,
      }),
    ]);
    let reminded = 0;
    for (const dose of reminders) {
      const claimed = await this.prisma.medicationAdministration.updateMany({
        where: { id: dose.id, status: "PLANNED", reminderSentAt: null },
        data: { reminderSentAt: now },
      });
      if (!claimed.count) continue;
      await this.notify.enqueue({
        channel: "in-app",
        to: dose.medicationOrder.episode.patient.portalUserId ?? undefined,
        title: "Pengingat obat",
        body: `${dose.medicationOrder.medicationName} ${dose.medicationOrder.dose} dijadwalkan ${dose.scheduledAt.toLocaleString("id-ID")}. Ikuti instruksi tenaga kesehatan.`,
      });
      reminded += 1;
    }
    let missed = 0;
    for (const dose of overdue) {
      const claimed = await this.prisma.medicationAdministration.updateMany({
        where: { id: dose.id, status: "PLANNED" },
        data: { status: "MISSED" },
      });
      if (!claimed.count) continue;
      await this.auditEpisodeEvent(
        "system",
        "MEDICATION_DOSE_MISSED",
        dose.medicationOrder.episodeId,
        {
          administrationId: dose.id,
          medicationOrderId: dose.medicationOrderId,
          scheduledAt: dose.scheduledAt.toISOString(),
        },
      );
      await this.notify.enqueueClinical(
        "Dosis obat belum tercatat",
        `${dose.medicationOrder.episode.code} · ${dose.medicationOrder.episode.patient.fullName}: ${dose.medicationOrder.medicationName} terjadwal ${dose.scheduledAt.toLocaleString("id-ID")}.`,
      );
      missed += 1;
    }
    return { reminded, missed };
  }

  async createVisit(id: string, dto: CreateVisitDto) {
    const episode = await this.requireEpisode(id);
    if (!([HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]).includes(episode.status))
      throw new BadRequestException(
        "Kunjungan hanya dapat dijadwalkan untuk episode admitted/active",
      );
    const start = new Date(dto.scheduledStart);
    const end = new Date(dto.scheduledEnd);
    if (end <= start)
      throw new BadRequestException("Waktu selesai harus setelah waktu mulai");
    const worker = await this.prisma.healthWorker.findUnique({
      where: { id: dto.healthWorkerId },
    });
    if (!worker || !worker.isActive || worker.licenseValidUntil <= new Date())
      throw new BadRequestException(
        "Tenaga kesehatan tidak aktif atau lisensinya kedaluwarsa",
      );
    const conflict = await this.prisma.haHVisit.findFirst({
      where: {
        healthWorkerId: dto.healthWorkerId,
        status: { notIn: [HaHVisitStatus.CANCELLED, HaHVisitStatus.COMPLETED] },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
    });
    if (conflict)
      throw new BadRequestException(
        "Jadwal tenaga kesehatan bertabrakan dengan kunjungan lain",
      );
    return this.prisma.haHVisit.create({
      data: {
        episodeId: id,
        healthWorkerId: dto.healthWorkerId,
        visitType: dto.visitType,
        scheduledStart: start,
        scheduledEnd: end,
      },
    });
  }

  listCareTeam(episodeId: string) {
    return this.prisma.careAssignment.findMany({
      where: { episodeId },
      include: {
        healthWorker: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { startsAt: "asc" }],
    });
  }

  async assignCareTeam(
    episodeId: string,
    dto: AssignCareTeamDto,
    actorId: string,
  ) {
    const episode = await this.requireEpisode(episodeId);
    if (
      !(
        [HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]
      ).includes(episode.status)
    )
      throw new BadRequestException("Tim hanya dapat ditugaskan pada episode aktif");
    const worker = await this.prisma.healthWorker.findUnique({
      where: { id: dto.healthWorkerId },
      include: { user: true },
    });
    if (!worker || !worker.isActive || worker.licenseValidUntil <= new Date())
      throw new BadRequestException(
        "Tenaga kesehatan tidak aktif atau lisensinya kedaluwarsa",
      );
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (endsAt && endsAt <= startsAt)
      throw new BadRequestException("Akhir penugasan harus setelah waktu mulai");
    const type = dto.type as CareAssignmentType;
    if (type === CareAssignmentType.PRIMARY_CLINICIAN && !worker.userId)
      throw new BadRequestException(
        "Dokter utama harus terhubung dengan akun pengguna",
      );
    const assignment = await this.prisma.$transaction(async (tx) => {
      await tx.careAssignment.updateMany({
        where: {
          episodeId,
          type,
          isActive: true,
          healthWorkerId: { not: worker.id },
        },
        data: {
          isActive: false,
          endsAt: new Date(),
          endedById: actorId,
          endReason: "Digantikan melalui koordinasi tim",
        },
      });
      const saved = await tx.careAssignment.upsert({
        where: {
          episodeId_healthWorkerId_type: {
            episodeId,
            healthWorkerId: worker.id,
            type,
          },
        },
        create: {
          episodeId,
          healthWorkerId: worker.id,
          type,
          responsibility: dto.responsibility,
          startsAt,
          endsAt,
          assignedById: actorId,
        },
        update: {
          responsibility: dto.responsibility,
          startsAt,
          endsAt: endsAt ?? null,
          isActive: true,
          assignedById: actorId,
          endedById: null,
          endReason: null,
        },
        include: { healthWorker: true },
      });
      if (type === CareAssignmentType.PRIMARY_CLINICIAN)
        await tx.haHEpisode.update({
          where: { id: episodeId },
          data: { attendingPhysicianId: worker.userId! },
        });
      return saved;
    });
    await this.auditEpisodeEvent(actorId, "CARE_TEAM_ASSIGNED", episodeId, {
      careAssignmentId: assignment.id,
      healthWorkerId: assignment.healthWorkerId,
      type: assignment.type,
    });
    return assignment;
  }

  async endCareAssignment(
    assignmentId: string,
    dto: EndCareAssignmentDto,
    actorId: string,
  ) {
    const current = await this.prisma.careAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!current?.episodeId)
      throw new NotFoundException("Penugasan episode tidak ditemukan");
    if (!current.isActive)
      throw new BadRequestException("Penugasan sudah tidak aktif");
    if (current.type === CareAssignmentType.PRIMARY_CLINICIAN)
      throw new BadRequestException(
        "Dokter utama harus diganti melalui penugasan baru, bukan diakhiri tanpa pengganti",
      );
    const assignment = await this.prisma.careAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        endsAt: new Date(),
        endedById: actorId,
        endReason: dto.reason,
      },
    });
    await this.auditEpisodeEvent(
      actorId,
      "CARE_TEAM_ASSIGNMENT_ENDED",
      current.episodeId,
      { careAssignmentId: assignmentId, reason: dto.reason },
    );
    return assignment;
  }

  listClinicalTasks(episodeId: string) {
    return this.prisma.haHClinicalTask.findMany({
      where: { episodeId },
      include: {
        assignedToHealthWorker: {
          select: { id: true, name: true, profession: true, zone: true },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    });
  }

  async listMyClinicalTasks(actorId: string, status?: ClinicalTaskStatus) {
    const worker = await this.prisma.healthWorker.findUnique({
      where: { userId: actorId },
      select: { id: true, isActive: true, licenseValidUntil: true },
    });
    if (!worker || !worker.isActive || worker.licenseValidUntil <= new Date())
      throw new ForbiddenException("Profil tenaga kesehatan tidak aktif");
    return this.prisma.haHClinicalTask.findMany({
      where: {
        assignedToHealthWorkerId: worker.id,
        ...(status ? { status } : {}),
      },
      include: {
        episode: { include: { patient: true } },
        assignedToHealthWorker: {
          select: { id: true, name: true, profession: true },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
      take: 200,
    });
  }

  async createClinicalTask(
    episodeId: string,
    dto: CreateClinicalTaskDto,
    actorId: string,
  ) {
    const episode = await this.requireEpisode(episodeId);
    if (
      !(
        [HaHEpisodeStatus.ADMITTED, HaHEpisodeStatus.ACTIVE] as HaHEpisodeStatus[]
      ).includes(episode.status)
    )
      throw new BadRequestException("Tugas memerlukan episode admitted/active");
    const worker = await this.prisma.healthWorker.findUnique({
      where: { id: dto.assignedToHealthWorkerId },
    });
    if (!worker || !worker.isActive || worker.licenseValidUntil <= new Date())
      throw new BadRequestException("Tenaga kesehatan tidak aktif");
    const assigned = await this.prisma.careAssignment.findFirst({
      where: {
        episodeId,
        healthWorkerId: worker.id,
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { id: true },
    });
    if (!assigned)
      throw new BadRequestException(
        "Tugas hanya dapat diberikan kepada anggota tim perawatan aktif",
      );
    const dueAt = new Date(dto.dueAt);
    if (dueAt <= new Date())
      throw new BadRequestException("Batas waktu tugas harus di masa depan");
    const task = await this.prisma.haHClinicalTask.create({
      data: {
        episodeId,
        assignedToHealthWorkerId: worker.id,
        title: dto.title,
        description: dto.description,
        category: dto.category as ClinicalTaskCategory,
        priority: dto.priority as ClinicalTaskPriority,
        dueAt,
        createdById: actorId,
      },
      include: {
        assignedToHealthWorker: {
          select: { id: true, name: true, profession: true, zone: true },
        },
      },
    });
    await this.auditEpisodeEvent(actorId, "CLINICAL_TASK_CREATED", episodeId, {
      clinicalTaskId: task.id,
      assignedToHealthWorkerId: worker.id,
      priority: task.priority,
    });
    return task;
  }

  async updateClinicalTask(
    id: string,
    dto: UpdateClinicalTaskDto,
    actor: AuthActor,
  ) {
    const task = await this.prisma.haHClinicalTask.findUnique({
      where: { id },
      include: { assignedToHealthWorker: { select: { userId: true } } },
    });
    if (!task) throw new NotFoundException("Tugas klinis tidak ditemukan");
    const elevated = actorHasAnyRole(actor, [
      "SUPER_ADMIN",
      "COORDINATOR",
      "DOCTOR",
    ]);
    if (task.assignedToHealthWorker.userId !== actor.id && !elevated)
      throw new ForbiddenException("Tugas ini ditugaskan kepada petugas lain");
    const next = dto.status as ClinicalTaskStatus;
    const transitions: Record<ClinicalTaskStatus, ClinicalTaskStatus[]> = {
      PLANNED: [
        ClinicalTaskStatus.IN_PROGRESS,
        ClinicalTaskStatus.CANCELLED,
      ],
      IN_PROGRESS: [
        ClinicalTaskStatus.COMPLETED,
        ClinicalTaskStatus.OMITTED,
        ClinicalTaskStatus.CANCELLED,
      ],
      COMPLETED: [],
      OMITTED: [],
      CANCELLED: [],
    };
    if (!transitions[task.status].includes(next))
      throw new BadRequestException(
        `Transisi tugas ${task.status} → ${next} tidak valid`,
      );
    const closureStatuses: ClinicalTaskStatus[] = [
      ClinicalTaskStatus.COMPLETED,
      ClinicalTaskStatus.OMITTED,
    ];
    if (
      closureStatuses.includes(next) &&
      (!dto.outcomeNote || dto.outcomeNote.trim().length < 5)
    )
      throw new BadRequestException("Hasil tindakan wajib didokumentasikan");
    if (
      closureStatuses.includes(next) &&
      (!dto.handoverNote || dto.handoverNote.trim().length < 5)
    )
      throw new BadRequestException("Handover wajib didokumentasikan");
    if (next === ClinicalTaskStatus.CANCELLED && !elevated)
      throw new ForbiddenException(
        "Pembatalan tugas memerlukan dokter atau koordinator",
      );
    const updated = await this.prisma.haHClinicalTask.update({
      where: { id },
      data: {
        status: next,
        outcomeNote: dto.outcomeNote,
        handoverNote: dto.handoverNote,
        ...(next === ClinicalTaskStatus.IN_PROGRESS
          ? { startedAt: new Date() }
          : {}),
        ...(closureStatuses.includes(next)
          ? { completedAt: new Date(), completedById: actor.id }
          : {}),
      },
    });
    await this.auditEpisodeEvent(
      actor.id,
      "CLINICAL_TASK_STATUS_CHANGED",
      task.episodeId,
      { clinicalTaskId: id, from: task.status, to: next },
    );
    return updated;
  }

  async updateVisit(id: string, dto: UpdateVisitStatusDto) {
    const visit = await this.prisma.haHVisit.findUnique({ where: { id } });
    if (!visit) throw new NotFoundException("Kunjungan tidak ditemukan");
    const next = dto.status as HaHVisitStatus;
    const transitions: Record<HaHVisitStatus, HaHVisitStatus[]> = {
      PLANNED: [HaHVisitStatus.EN_ROUTE, HaHVisitStatus.CANCELLED],
      EN_ROUTE: [HaHVisitStatus.IN_PROGRESS, HaHVisitStatus.CANCELLED],
      IN_PROGRESS: [HaHVisitStatus.COMPLETED],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!transitions[visit.status].includes(next))
      throw new BadRequestException(
        `Transisi kunjungan ${visit.status} → ${next} tidak valid`,
      );
    if (next === HaHVisitStatus.COMPLETED && !dto.handoverNote)
      throw new BadRequestException("Handover note wajib saat kunjungan selesai");
    return this.prisma.haHVisit.update({
      where: { id },
      data: {
        status: next,
        handoverNote: dto.handoverNote,
        ...(next === HaHVisitStatus.IN_PROGRESS ? { arrivedAt: new Date() } : {}),
        ...(next === HaHVisitStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });
  }

  async listCaregivers(episodeId: string) {
    const episode = await this.requireEpisode(episodeId);
    return this.prisma.haHCaregiverAccess.findMany({
      where: { patientId: episode.patientId },
      include: {
        caregiver: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async grantCaregiverAccess(
    episodeId: string,
    dto: GrantCaregiverAccessDto,
    actorId: string,
  ) {
    const episode = await this.requireEpisode(episodeId);
    if (!dto.caregiverUserId && !dto.caregiverEmail)
      throw new BadRequestException("ID atau email caregiver wajib diisi");
    const caregiver = await this.prisma.user.findFirst({
      where: dto.caregiverUserId
        ? { id: dto.caregiverUserId }
        : { email: dto.caregiverEmail },
    });
    if (
      !caregiver ||
      !caregiver.isActive ||
      !["CAREGIVER", "PATIENT"].includes(caregiver.role)
    )
      throw new BadRequestException(
        "Akun caregiver tidak aktif atau perannya tidak sesuai",
      );
    if (!dto.scope.includes("SUMMARY"))
      throw new BadRequestException("Scope SUMMARY wajib untuk akses caregiver");
    const consentAt = new Date(dto.consentAt);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    if (consentAt > new Date())
      throw new BadRequestException("Waktu consent tidak boleh di masa depan");
    if (expiresAt && expiresAt <= consentAt)
      throw new BadRequestException("Masa berlaku harus setelah waktu consent");
    const access = await this.prisma.haHCaregiverAccess.upsert({
      where: {
        patientId_caregiverId: {
          patientId: episode.patientId,
          caregiverId: caregiver.id,
        },
      },
      create: {
        patientId: episode.patientId,
        caregiverId: caregiver.id,
        scope: dto.scope,
        consentBy: dto.consentBy,
        consentAt,
        expiresAt,
      },
      update: {
        scope: dto.scope,
        consentBy: dto.consentBy,
        consentAt,
        expiresAt: expiresAt ?? null,
        revokedAt: null,
        revokedById: null,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "CAREGIVER_ACCESS_GRANTED",
        entity: "HaHCaregiverAccess",
        entityId: access.id,
      },
    });
    return access;
  }

  async revokeCaregiverAccess(episodeId: string, caregiverId: string, actorId: string) {
    const episode = await this.requireEpisode(episodeId);
    const access = await this.prisma.haHCaregiverAccess.findUnique({
      where: { patientId_caregiverId: { patientId: episode.patientId, caregiverId } },
    });
    if (!access) throw new NotFoundException("Akses caregiver tidak ditemukan");
    const result = await this.prisma.haHCaregiverAccess.update({
      where: { id: access.id },
      data: { revokedAt: new Date(), revokedById: actorId },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "CAREGIVER_ACCESS_REVOKED",
        entity: "HaHCaregiverAccess",
        entityId: access.id,
      },
    });
    return result;
  }

  markMessageRead(messageId: string) {

    return this.prisma.haHClinicalMessage.update({

      where: { id: messageId },

      data: { readAt: new Date() },

    });

  }


  listMessages(episodeId: string) {
    return this.prisma.haHClinicalMessage.findMany({
      where: { episodeId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }
  sendMessage(episodeId: string, dto: SendClinicalMessageDto, senderId: string) {
    return this.prisma.haHClinicalMessage.create({
      data: {
        episodeId,
        senderId,
        body: dto.body,
        category: dto.category ?? "GENERAL",
        priority: dto.priority ?? "ROUTINE",
        attachmentUrls: dto.attachmentUrls ?? [],
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  }

  async escalateOverdueAlerts() {
    const alerts = await this.prisma.clinicalAlert.findMany({
      where: {
        status: { not: ClinicalAlertStatus.RESOLVED },
        responseDueAt: { lt: new Date() },
        escalationLevel: { lt: 3 },
        OR: [
          { lastEscalatedAt: null },
          { lastEscalatedAt: { lt: new Date(Date.now() - 15 * 60_000) } },
        ],
      },
      include: { episode: { include: { patient: true } } },
      take: 50,
    });
    const route = ["Perawat", "Dokter", "Rujukan Rumah Sakit"];
    for (const alert of alerts) {
      const level = alert.escalationLevel + 1;
      await this.prisma.$transaction([
        this.prisma.clinicalAlert.update({
          where: { id: alert.id },
          data: { escalationLevel: level, lastEscalatedAt: new Date() },
        }),
        this.prisma.clinicalAlertEvent.create({
          data: {
            alertId: alert.id,
            type: "ALERT_ESCALATED",
            detail: { level, target: route[level - 1] },
          },
        }),
        this.prisma.auditLog.create({
          data: {
            actorId: "system",
            action: "ALERT_ESCALATED",
            entity: "ClinicalAlert",
            entityId: alert.id,
            after: { level, target: route[level - 1] },
          },
        }),
      ]);
      await this.notify.enqueueClinical(
        `Eskalasi ${alert.severity} ke ${route[level - 1]}`,
        `${alert.episode.code} · ${alert.episode.patient.fullName}: ${alert.trigger}`,
      );
    }
  }

  async createEmergencyEvent(
    episodeId: string,
    dto: CreateEmergencyEventDto,
    actorId: string,
  ) {
    const episode = await this.requireEpisode(episodeId);
    if (
      !(
        [
          HaHEpisodeStatus.ADMITTED,
          HaHEpisodeStatus.ACTIVE,
          HaHEpisodeStatus.TRANSFER_REQUESTED,
        ] as HaHEpisodeStatus[]
      ).includes(episode.status)
    )
      throw new BadRequestException("Episode tidak aktif untuk respons darurat");
    if (
      (dto.latitude === undefined) !== (dto.longitude === undefined)
    )
      throw new BadRequestException(
        "Latitude dan longitude harus dikirim bersama",
      );
    const event = await this.prisma.haHEmergencyEvent.create({
      data: {
        episodeId,
        actorId,
        action: dto.action as EmergencyAction,
        latitude: dto.latitude,
        longitude: dto.longitude,
        note: dto.note,
      },
    });
    await this.auditEpisodeEvent(actorId, "EMERGENCY_ACTION_STARTED", episodeId, {
      emergencyEventId: event.id,
      action: event.action,
      hasLocation: event.latitude !== null,
    });
    await this.notify.enqueueClinical(
      `DARURAT · ${event.action.replaceAll("_", " ")}`,
      `${episode.code}: bantuan darurat dimulai. Segera verifikasi kondisi, lokasi, dan jalur eskalasi pasien.`,
    );
    return event;
  }

  listOpenEmergencyEvents() {
    return this.prisma.haHEmergencyEvent.findMany({
      where: { status: { not: EmergencyEventStatus.RESOLVED } },
      include: {
        episode: {
          include: {
            patient: true,
            observations: { orderBy: { recordedAt: "desc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  async acknowledgeEmergencyEvent(id: string, actorId: string) {
    const claimed = await this.prisma.haHEmergencyEvent.updateMany({
      where: { id, status: EmergencyEventStatus.OPEN },
      data: {
        status: EmergencyEventStatus.ACKNOWLEDGED,
        acknowledgedById: actorId,
        acknowledgedAt: new Date(),
      },
    });
    if (!claimed.count) {
      const current = await this.prisma.haHEmergencyEvent.findUnique({
        where: { id },
      });
      if (!current) throw new NotFoundException("Kejadian darurat tidak ditemukan");
      if (current.status === EmergencyEventStatus.RESOLVED)
        throw new BadRequestException("Kejadian darurat sudah diselesaikan");
      return current;
    }
    const event = await this.prisma.haHEmergencyEvent.findUniqueOrThrow({
      where: { id },
    });
    await this.auditEpisodeEvent(
      actorId,
      "EMERGENCY_ACTION_ACKNOWLEDGED",
      event.episodeId,
      { emergencyEventId: id },
    );
    return event;
  }

  async resolveEmergencyEvent(id: string, actorId: string, resolution: string) {
    const current = await this.prisma.haHEmergencyEvent.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException("Kejadian darurat tidak ditemukan");
    if (current.status === EmergencyEventStatus.RESOLVED)
      throw new BadRequestException("Kejadian darurat sudah diselesaikan");
    const event = await this.prisma.haHEmergencyEvent.update({
      where: { id },
      data: {
        status: EmergencyEventStatus.RESOLVED,
        acknowledgedById: current.acknowledgedById ?? actorId,
        acknowledgedAt: current.acknowledgedAt ?? new Date(),
        resolvedById: actorId,
        resolvedAt: new Date(),
        resolution,
      },
    });
    await this.auditEpisodeEvent(actorId, "EMERGENCY_ACTION_RESOLVED", event.episodeId, {
      emergencyEventId: id,
      resolution,
    });
    return event;
  }

  async listEpisodes(status?: HaHEpisodeStatus, actor?: AuthActor) {
    const isClinical = !!actor && actorHasAnyRole(actor, CLINICAL_ROLES);
    const isPatient = !!actor && actorHasAnyRole(actor, ["PATIENT"]);
    const isCaregiver = !!actor && actorHasAnyRole(actor, ["CAREGIVER"]);
    const access =
      actor && isClinical
            ? {
                OR: [
                  { attendingPhysicianId: actor.id },
                  { visits: { some: { healthWorker: { userId: actor.id } } } },
                  {
                    careAssignments: {
                      some: {
                        isActive: true,
                        healthWorker: { userId: actor.id },
                      },
                    },
                  },
                ],
              }
            : actor && (isPatient || isCaregiver)
              ? {
                  OR: [
                    ...(isPatient
                      ? [{ patient: { portalUserId: actor.id } }]
                      : []),
                    ...(isCaregiver
                      ? [
                          {
                            patient: {
                              caregiverAccesses: {
                                some: {
                                  caregiverId: actor.id,
                                  revokedAt: null,
                                  scope: { array_contains: ["SUMMARY"] },
                                  OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gt: new Date() } },
                                  ],
                                },
                              },
                            },
                          },
                        ]
                      : []),
                  ],
                }
            : {};
    const rows = await this.prisma.haHEpisode.findMany({
      where: { ...access, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        eligibility: true,
        carePlan: true,
        _count: { select: { alerts: true, observations: true, visits: true } },
      },
    });
    if (!actor || isClinical || !isCaregiver) return rows;
    const caregiverRows = rows.filter(
      (row) => row.patient.portalUserId !== actor.id,
    );
    const grants = await this.prisma.haHCaregiverAccess.findMany({
      where: {
        caregiverId: actor.id,
        patientId: { in: caregiverRows.map((row) => row.patientId) },
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { patientId: true, scope: true },
    });
    const scopes = new Map(
      grants.map((grant) => [
        grant.patientId,
        caregiverScopeList(grant.scope),
      ]),
    );
    return rows.map((row) => {
      if (row.patient.portalUserId === actor.id) return row;
      const scope = scopes.get(row.patientId) ?? [];
      return {
        ...row,
        eligibility: scope.includes("CARE_PLAN") ? row.eligibility : null,
        carePlan: scope.includes("CARE_PLAN") ? row.carePlan : null,
        patient: { ...row.patient, nationalId: null },
      };
    });
  }

  listOpenAlerts() {
    return this.prisma.clinicalAlert.findMany({
      where: { status: { not: ClinicalAlertStatus.RESOLVED } },
      orderBy: [{ severity: "desc" }, { responseDueAt: "asc" }],
      include: { episode: { include: { patient: true } }, observation: true },
    });
  }

  async getEpisode(id: string, actor?: AuthActor) {
    const isClinical = !!actor && actorHasAnyRole(actor, CLINICAL_ROLES);
    const isPatient = !!actor && actorHasAnyRole(actor, ["PATIENT"]);
    const isCaregiver = !!actor && actorHasAnyRole(actor, ["CAREGIVER"]);
    const access =
      actor && isClinical
            ? {
                OR: [
                  { attendingPhysicianId: actor.id },
                  { visits: { some: { healthWorker: { userId: actor.id } } } },
                  {
                    careAssignments: {
                      some: {
                        isActive: true,
                        healthWorker: { userId: actor.id },
                      },
                    },
                  },
                ],
              }
            : actor && (isPatient || isCaregiver)
              ? {
                  OR: [
                    ...(isPatient
                      ? [{ patient: { portalUserId: actor.id } }]
                      : []),
                    ...(isCaregiver
                      ? [
                          {
                            patient: {
                              caregiverAccesses: {
                                some: {
                                  caregiverId: actor.id,
                                  revokedAt: null,
                                  OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gt: new Date() } },
                                  ],
                                },
                              },
                            },
                          },
                        ]
                      : []),
                  ],
                }
            : {};
    const result = await this.prisma.haHEpisode.findFirstOrThrow({
      where: { id, ...access },
      include: {
        patient: true,
        eligibility: true,
        carePlan: true,
        carePlanRevisions: { orderBy: { version: "desc" }, take: 10 },
        clinicalEvaluations: { orderBy: { evaluatedAt: "desc" }, take: 20 },
        emergencyEvents: { orderBy: { createdAt: "desc" }, take: 20 },
        careAssignments: {
          include: {
            healthWorker: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
          orderBy: [{ isActive: "desc" }, { startsAt: "asc" }],
        },
        clinicalTasks: {
          include: {
            assignedToHealthWorker: {
              select: { id: true, name: true, profession: true, zone: true },
            },
          },
          orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
          include: { sender: { select: { id: true, name: true, role: true } } },
        },
        observations: { orderBy: { recordedAt: "desc" }, take: 20 },
        alerts: { orderBy: { createdAt: "desc" } },
        visits: { orderBy: { scheduledStart: "asc" } },
        medicationOrders: { include: { administrations: true } },
        transfers: { orderBy: { requestedAt: "desc" } },
        diagnosticOrders: { orderBy: { orderedAt: "desc" } },
        equipmentAssignments: { orderBy: { requestedAt: "desc" } },
      },
    });
    if (actor)
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "READ_CLINICAL_RECORD",
          entity: "HaHEpisode",
          entityId: id,
        },
      });
    const caregiverMode =
      !!actor &&
      !isClinical &&
      isCaregiver &&
      result.patient.portalUserId !== actor.id;
    if (!caregiverMode) return result;
    const grant = await this.prisma.haHCaregiverAccess.findFirst({
      where: {
        patientId: result.patientId,
        caregiverId: actor.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { scope: true, consentAt: true, expiresAt: true },
    });
    const scope = caregiverScopeList(grant?.scope);
    if (!grant || !scope.includes("SUMMARY"))
      throw new ForbiddenException("Consent caregiver tidak mencakup ringkasan");
    const visible: any = result;
    visible.patient.nationalId = null;
    if (!scope.includes("VITALS")) {
      visible.observations = [];
      visible.alerts = [];
    }
    if (!scope.includes("CARE_PLAN")) {
      visible.eligibility = null;
      visible.carePlan = null;
      visible.carePlanRevisions = [];
      visible.clinicalEvaluations = [];
      visible.transfers = [];
      visible.equipmentAssignments = [];
      visible.clinicalTasks = [];
    }
    if (!scope.includes("MEDICATIONS")) visible.medicationOrders = [];
    if (!scope.includes("DIAGNOSTICS")) visible.diagnosticOrders = [];
    if (!scope.includes("SCHEDULE")) visible.visits = [];
    if (!scope.includes("MESSAGES")) visible.messages = [];
    visible.emergencyEvents = [];
    visible.caregiverAccess = {
      scope,
      consentAt: grant.consentAt,
      expiresAt: grant.expiresAt,
    };
    return visible;
  }

  private async requireEpisode(id: string) {
    const e = await this.prisma.haHEpisode.findUnique({
      where: { id },
      include: { eligibility: true },
    });
    if (!e) throw new NotFoundException("Episode HaH tidak ditemukan");
    return e;
  }
}
