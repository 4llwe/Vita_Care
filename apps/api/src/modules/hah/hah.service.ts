import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import {
  Prisma,
  ClinicalAlertSeverity,
  ClinicalAlertStatus,
  DiagnosticOrderStatus,
  EquipmentAssignmentStatus,
  HaHEligibilityDecision,
  HaHEpisodeStatus,
  HaHVisitStatus,
  MedicationOrderStatus,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";
import {
  AdministerMedicationDto,
  ApproveClinicalProtocolDto,
  BreakGlassAccessDto,
  AdmitEpisodeDto,
  AssessEligibilityDto,
  CarePlanDto,
  CreateClinicalProtocolDto,
  CreateDiagnosticOrderDto,
  CreateEquipmentAssignmentDto,
  CreateEpisodeDto,
  CreateMedicationOrderDto,
  CreatePatientDto,
  CreateVisitDto,
  DiagnosticResultDto,
  DischargeDto,
  GrantCaregiverAccessDto,
  RecordObservationDto,
  SendClinicalMessageDto,
  TransferDto,
  UpdateEquipmentStatusDto,
  UpdateMedicationStatusDto,
  UpdateVisitStatusDto,
} from "./dto/hah.dto";
import {
  ClinicalProtocolConfig,
  computeHaHClinicalScore,
  DEFAULT_CLINICAL_PROTOCOL,
} from "./clinical-score";
import { validateClinicalProtocol } from "./clinical-protocol.validation";

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

  async activeProtocol() {
    return this.prisma.haHClinicalProtocol.findFirst({
      where: { status: "ACTIVE", activeFrom: { lte: new Date() }, retiredAt: null },
      orderBy: { version: "desc" },
    });
  }

  private async protocolConfig(): Promise<ClinicalProtocolConfig> {
    const row = await this.activeProtocol();
    if (!row) return DEFAULT_CLINICAL_PROTOCOL;
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
      include: { healthWorkerProfile: true },
    });
    if (
      !user ||
      !user.isActive ||
      (user.role === "HEALTH_WORKER" &&
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
    return this.prisma.haHPatient.create({
      data: {
        mrn: await this.nextCode("MRN", "patient"),
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
    await this.notify.send({
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

  async discharge(id: string, dto: DischargeDto) {
    const e = await this.requireEpisode(id);
    const openAlerts = await this.prisma.clinicalAlert.count({
      where: { episodeId: id, status: { not: ClinicalAlertStatus.RESOLVED } },
    });
    if (openAlerts)
      throw new BadRequestException(
        `Selesaikan ${openAlerts} alert klinis sebelum discharge`,
      );
    if (!([HaHEpisodeStatus.ACTIVE, HaHEpisodeStatus.TRANSFERRED] as HaHEpisodeStatus[]).includes(e.status))
      throw new BadRequestException("Episode belum dapat didischarge");
    return this.prisma.haHEpisode.update({
      where: { id },
      data: {
        status: HaHEpisodeStatus.DISCHARGED,
        dischargeAt: new Date(),
        dischargeDisposition: dto.dischargeDisposition,
        dischargeSummary: dto.dischargeSummary,
      },
    });
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
      await this.notify.send({
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
      ? episode.patient.allergies.map((x) => String(x).toLowerCase())
      : [];
    if (
      allergies.some(
        (a) =>
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
    return this.prisma.medicationOrder.create({
      data: {
        episodeId: id,
        medicationName: dto.medicationName,
        dose: dto.dose,
        route: dto.route,
        frequency: dto.frequency,
        indication: dto.indication,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        prescribedById: actorId,
      },
    });
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
    return this.prisma.medicationAdministration.create({
      data: {
        medicationOrderId: id,
        administeredById: actorId,
        scheduledAt: new Date(dto.scheduledAt),
        administeredAt:
          dto.status === "GIVEN" ? new Date(dto.administeredAt ?? new Date()) : undefined,
        status: dto.status,
        note: dto.note,
      },
    });
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
    const caregiver = await this.prisma.user.findUnique({
      where: { id: dto.caregiverUserId },
    });
    if (
      !caregiver ||
      !caregiver.isActive ||
      !["CAREGIVER", "PATIENT"].includes(caregiver.role)
    )
      throw new BadRequestException(
        "Akun caregiver tidak aktif atau perannya tidak sesuai",
      );
    const access = await this.prisma.haHCaregiverAccess.upsert({
      where: {
        patientId_caregiverId: {
          patientId: episode.patientId,
          caregiverId: dto.caregiverUserId,
        },
      },
      create: {
        patientId: episode.patientId,
        caregiverId: dto.caregiverUserId,
        scope: dto.scope,
        consentBy: dto.consentBy,
        consentAt: new Date(dto.consentAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      update: {
        scope: dto.scope,
        consentBy: dto.consentBy,
        consentAt: new Date(dto.consentAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
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

  @Interval(60_000)
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

  listEpisodes(status?: HaHEpisodeStatus, actor?: { id: string; role: string }) {
    const access =
      actor?.role === "PATIENT"
        ? { patient: { portalUserId: actor.id } }
        : actor?.role === "CAREGIVER"
          ? {
              patient: {
                caregiverAccesses: {
                  some: {
                    caregiverId: actor.id,
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
              },
            }
          : actor?.role === "HEALTH_WORKER"
            ? {
                OR: [
                  { attendingPhysicianId: actor.id },
                  { visits: { some: { healthWorker: { userId: actor.id } } } },
                ],
              }
            : {};
    return this.prisma.haHEpisode.findMany({
      where: { ...access, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        eligibility: true,
        carePlan: true,
        _count: { select: { alerts: true, observations: true, visits: true } },
      },
    });
  }

  listOpenAlerts() {
    return this.prisma.clinicalAlert.findMany({
      where: { status: { not: ClinicalAlertStatus.RESOLVED } },
      orderBy: [{ severity: "desc" }, { responseDueAt: "asc" }],
      include: { episode: { include: { patient: true } }, observation: true },
    });
  }

  async getEpisode(id: string, actor?: { id: string; role: string }) {
    const access =
      actor?.role === "PATIENT"
        ? { patient: { portalUserId: actor.id } }
        : actor?.role === "CAREGIVER"
          ? {
              patient: {
                caregiverAccesses: {
                  some: {
                    caregiverId: actor.id,
                    revokedAt: null,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                  },
                },
              },
            }
          : actor?.role === "HEALTH_WORKER"
            ? {
                OR: [
                  { attendingPhysicianId: actor.id },
                  { visits: { some: { healthWorker: { userId: actor.id } } } },
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
    return result;
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
