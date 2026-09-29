import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ClinicalTaskStatus,
  DiagnosticOrderStatus,
  HaHEpisodeStatus,
} from "@prisma/client";
import { AuthActor } from "../../common/auth/actor";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  AdministerMedicationDto,
  AcknowledgeDiagnosticDto,
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
  CreateEquipmentSafetyCheckDto,
  CreateEpisodeDto,
  CreateMedicationOrderDto,
  CreateMedicationFulfillmentDto,
  CreatePatientDto,
  CreateVisitDto,
  CreateTeleconsultationDto,
  CreateWoundAssessmentDto,
  CreateFunctionalAssessmentDto,
  CreateNutritionAssessmentDto,
  CreatePalliativeAssessmentDto,
  CreateEducationRecordDto,
  DiagnosticResultDto,
  DischargeDto,
  EndCareAssignmentDto,
  GrantCaregiverAccessDto,
  RecordObservationDto,
  ResolveAlertDto,
  ResolveEmergencyEventDto,
  SendClinicalMessageDto,
  TransferDto,
  UpdateEquipmentStatusDto,
  UpdateDiagnosticStatusDto,
  UpdateClinicalTaskDto,
  UpdateMedicationStatusDto,
  UpdateMedicationFulfillmentDto,
  UpdateVisitStatusDto,
  UpdateTeleconsultationDto,
  UpsertDischargeChecklistDto,
  CreatePostDischargeFollowUpDto,
} from "./dto/hah.dto";
import { HaHService } from "./hah.service";
import { HaHAccessGuard } from "./hah-access.guard";

@Controller("hah")
@UseGuards(JwtAuthGuard, HaHAccessGuard, RolesGuard)
export class HaHController {
  constructor(private readonly hah: HaHService) {}

  @Post("patients")
  @Roles("COORDINATOR", "HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createPatient(@Body() dto: CreatePatientDto) {
    return this.hah.createPatient(dto);
  }

  @Post("episodes")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  createEpisode(@Body() dto: CreateEpisodeDto, @CurrentUser() u: { id: string }) {
    return this.hah.createEpisode(dto, u.id);
  }

  @Post("episodes/:id/eligibility")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  assess(
    @Param("id") id: string,
    @Body() dto: AssessEligibilityDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.assessEligibility(id, dto, u.id);
  }

  @Post("episodes/:id/admit")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  admit(@Param("id") id: string, @Body() dto: AdmitEpisodeDto) {
    return this.hah.admit(id, dto);
  }

  @Post("episodes/:id/care-plan")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  carePlan(
    @Param("id") id: string,
    @Body() dto: CarePlanDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.upsertCarePlan(id, dto, u.id);
  }

  @Post("episodes/:id/observations")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  observation(
    @Param("id") id: string,
    @Body() dto: RecordObservationDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.recordObservation(id, dto, u.id);
  }

  @Post("episodes/:id/evaluations")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  clinicalEvaluation(
    @Param("id") id: string,
    @Body() dto: CreateClinicalEvaluationDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createClinicalEvaluation(id, dto, u.id);
  }

  @Get("episodes/:id/discharge-readiness")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  dischargeReadiness(@Param("id") id: string) {
    return this.hah.dischargeReadiness(id);
  }

  @Post("episodes/:id/discharge-checklist")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  dischargeChecklist(
    @Param("id") id: string,
    @Body() dto: UpsertDischargeChecklistDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.upsertDischargeChecklist(id, dto, actor.id);
  }

  @Get("episodes/:id/post-discharge-followups")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  postDischargeFollowUps(@Param("id") id: string) {
    return this.hah.listPostDischargeFollowUps(id);
  }

  @Post("episodes/:id/post-discharge-followups")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  createPostDischargeFollowUp(
    @Param("id") id: string,
    @Body() dto: CreatePostDischargeFollowUpDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createPostDischargeFollowUp(id, dto, actor.id);
  }

  @Patch("alerts/:id/acknowledge")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  acknowledge(@Param("id") id: string, @CurrentUser() u: { id: string }) {
    return this.hah.acknowledgeAlert(id, u.id);
  }

  @Patch("alerts/:id/resolve")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  resolve(
    @Param("id") id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.resolveAlert(id, u.id, dto.resolution);
  }

  @Post("episodes/:id/transfer")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  transfer(
    @Param("id") id: string,
    @Body() dto: TransferDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.transfer(id, dto, u.id);
  }

  @Patch("transfers/:id/arrive")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  completeTransfer(@Param("id") id: string) {
    return this.hah.completeTransfer(id);
  }

  @Post("episodes/:id/discharge")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  discharge(
    @Param("id") id: string,
    @Body() dto: DischargeDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.discharge(id, dto, u.id);
  }

  @Post("episodes/:id/diagnostics")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  diagnostic(
    @Param("id") id: string,
    @Body() dto: CreateDiagnosticOrderDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createDiagnosticOrder(id, dto, u.id);
  }

  @Get("diagnostics")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  diagnostics(
    @CurrentUser() actor: AuthActor,
    @Query("status") status?: DiagnosticOrderStatus,
  ) {
    return this.hah.listDiagnostics(actor, status);
  }

  @Patch("diagnostics/:id/status")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  diagnosticStatus(
    @Param("id") id: string,
    @Body() dto: UpdateDiagnosticStatusDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.updateDiagnosticStatus(id, dto, u.id);
  }

  @Patch("diagnostics/:id/result")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  diagnosticResult(
    @Param("id") id: string,
    @Body() dto: DiagnosticResultDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.resultDiagnostic(id, dto, u.id);
  }

  @Patch("diagnostics/:id/acknowledge")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  diagnosticAck(
    @Param("id") id: string,
    @Body() dto: AcknowledgeDiagnosticDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.acknowledgeDiagnostic(id, dto, u.id);
  }

  @Post("episodes/:id/equipment")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  equipment(
    @Param("id") id: string,
    @Body() dto: CreateEquipmentAssignmentDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.assignEquipment(id, dto, u.id);
  }

  @Patch("equipment/:id/status")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  equipmentStatus(@Param("id") id: string, @Body() dto: UpdateEquipmentStatusDto) {
    return this.hah.updateEquipment(id, dto);
  }

  @Get("equipment/:id/checks")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  equipmentChecks(@Param("id") id: string) {
    return this.hah.listEquipmentSafetyChecks(id);
  }

  @Post("equipment/:id/checks")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createEquipmentCheck(
    @Param("id") id: string,
    @Body() dto: CreateEquipmentSafetyCheckDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createEquipmentSafetyCheck(id, dto, actor.id);
  }

  @Get("patients")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  patients(@Query("q") query?: string) {
    return this.hah.listPatients(query);
  }

  @Post("episodes/:id/medications")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  medication(
    @Param("id") id: string,
    @Body() dto: CreateMedicationOrderDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createMedicationOrder(id, dto, u.id);
  }

  @Patch("medications/:id/status")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  medicationStatus(@Param("id") id: string, @Body() dto: UpdateMedicationStatusDto) {
    return this.hah.updateMedicationStatus(id, dto);
  }

  @Post("medications/:id/administrations")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  administer(
    @Param("id") id: string,
    @Body() dto: AdministerMedicationDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.administerMedication(id, dto, u.id);
  }

  @Get("episodes/:id/medication-adherence")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  medicationAdherence(@Param("id") id: string) {
    return this.hah.medicationAdherence(id);
  }

  @Get("episodes/:id/wounds")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  woundAssessments(@Param("id") id: string) {
    return this.hah.listWoundAssessments(id);
  }

  @Get("episodes/:id/functional-assessments")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  functionalAssessments(@Param("id") id: string) {
    return this.hah.listFunctionalAssessments(id);
  }

  @Get("episodes/:id/nutrition-assessments")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  nutritionAssessments(@Param("id") id: string) {
    return this.hah.listNutritionAssessments(id);
  }

  @Get("episodes/:id/palliative-assessments")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  palliativeAssessments(@Param("id") id: string) {
    return this.hah.listPalliativeAssessments(id);
  }

  @Get("episodes/:id/education-records")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  educationRecords(@Param("id") id: string) {
    return this.hah.listEducationRecords(id);
  }

  @Post("episodes/:id/education-records")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createEducationRecord(
    @Param("id") id: string,
    @Body() dto: CreateEducationRecordDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createEducationRecord(id, dto, actor.id);
  }

  @Post("episodes/:id/palliative-assessments")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createPalliativeAssessment(
    @Param("id") id: string,
    @Body() dto: CreatePalliativeAssessmentDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createPalliativeAssessment(id, dto, actor.id);
  }

  @Post("episodes/:id/nutrition-assessments")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createNutritionAssessment(
    @Param("id") id: string,
    @Body() dto: CreateNutritionAssessmentDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createNutritionAssessment(id, dto, actor.id);
  }

  @Post("episodes/:id/functional-assessments")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createFunctionalAssessment(
    @Param("id") id: string,
    @Body() dto: CreateFunctionalAssessmentDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createFunctionalAssessment(id, dto, actor.id);
  }

  @Post("episodes/:id/wounds")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "SUPER_ADMIN")
  createWoundAssessment(
    @Param("id") id: string,
    @Body() dto: CreateWoundAssessmentDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createWoundAssessment(id, dto, actor.id);
  }

  @Post("medications/:id/fulfillments")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  requestMedicationFulfillment(
    @Param("id") id: string,
    @Body() dto: CreateMedicationFulfillmentDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.requestMedicationFulfillment(id, dto, u.id);
  }

  @Get("pharmacy/fulfillments")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  medicationFulfillments(@CurrentUser() actor: AuthActor) {
    return this.hah.listMedicationFulfillments(actor);
  }

  @Patch("pharmacy-fulfillments/:id")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  updateMedicationFulfillment(
    @Param("id") id: string,
    @Body() dto: UpdateMedicationFulfillmentDto,
    @CurrentUser() actor: AuthActor,
  ) {
    return this.hah.updateMedicationFulfillment(id, dto, actor);
  }

  @Post("episodes/:id/visits")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  visit(@Param("id") id: string, @Body() dto: CreateVisitDto) {
    return this.hah.createVisit(id, dto);
  }

  @Get("episodes/:id/teleconsultations")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  teleconsultations(@Param("id") id: string) {
    return this.hah.listTeleconsultations(id);
  }

  @Post("episodes/:id/teleconsultations")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  createTeleconsultation(
    @Param("id") id: string,
    @Body() dto: CreateTeleconsultationDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.hah.createTeleconsultation(id, dto, actor.id);
  }

  @Patch("teleconsultations/:id")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  updateTeleconsultation(
    @Param("id") id: string,
    @Body() dto: UpdateTeleconsultationDto,
    @CurrentUser() actor: AuthActor,
  ) {
    return this.hah.updateTeleconsultation(id, dto, actor);
  }

  @Get("episodes/:id/care-team")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  careTeam(@Param("id") id: string) {
    return this.hah.listCareTeam(id);
  }

  @Get("tasks/my")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE")
  myClinicalTasks(
    @CurrentUser() u: { id: string },
    @Query("status") status?: ClinicalTaskStatus,
  ) {
    return this.hah.listMyClinicalTasks(u.id, status);
  }

  @Get("episodes/:id/tasks")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  clinicalTasks(@Param("id") id: string) {
    return this.hah.listClinicalTasks(id);
  }

  @Post("episodes/:id/tasks")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  createClinicalTask(
    @Param("id") id: string,
    @Body() dto: CreateClinicalTaskDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createClinicalTask(id, dto, u.id);
  }

  @Patch("clinical-tasks/:id")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  updateClinicalTask(
    @Param("id") id: string,
    @Body() dto: UpdateClinicalTaskDto,
    @CurrentUser() u: { id: string; role: string; roles?: string[] },
  ) {
    return this.hah.updateClinicalTask(id, dto, u as any);
  }

  @Post("episodes/:id/care-team")
  @Roles("COORDINATOR", "SUPER_ADMIN")
  assignCareTeam(
    @Param("id") id: string,
    @Body() dto: AssignCareTeamDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.assignCareTeam(id, dto, u.id);
  }

  @Patch("care-assignments/:id/end")
  @Roles("COORDINATOR", "SUPER_ADMIN")
  endCareAssignment(
    @Param("id") id: string,
    @Body() dto: EndCareAssignmentDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.endCareAssignment(id, dto, u.id);
  }

  @Patch("visits/:id/status")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  visitStatus(
    @Param("id") id: string,
    @Body() dto: UpdateVisitStatusDto,
    @CurrentUser() actor: AuthActor,
  ) {
    return this.hah.updateVisit(id, dto, actor);
  }

  @Get("episodes")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  list(
    @CurrentUser() u: { id: string; role: string },
    @Query("status") status?: HaHEpisodeStatus,
  ) {
    return this.hah.listEpisodes(status, u);
  }

  @Post("episodes/:id/emergency-events")
  @Roles(
    "PATIENT",
    "CAREGIVER",
    "HEALTH_WORKER",
    "DOCTOR",
    "NURSE",
    "COORDINATOR",
    "SUPER_ADMIN",
  )
  createEmergencyEvent(
    @Param("id") id: string,
    @Body() dto: CreateEmergencyEventDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createEmergencyEvent(id, dto, u.id);
  }

  @Get("emergency-events/open")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  openEmergencyEvents() {
    return this.hah.listOpenEmergencyEvents();
  }

  @Patch("emergency-events/:id/acknowledge")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  acknowledgeEmergencyEvent(
    @Param("id") id: string,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.acknowledgeEmergencyEvent(id, u.id);
  }

  @Patch("emergency-events/:id/resolve")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  resolveEmergencyEvent(
    @Param("id") id: string,
    @Body() dto: ResolveEmergencyEventDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.resolveEmergencyEvent(id, u.id, dto.resolution);
  }

  @Get("episodes/:id")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  get(@Param("id") id: string, @CurrentUser() u: { id: string; role: string }) {
    return this.hah.getEpisode(id, u);
  }

  @Get("episodes/:id/caregivers")
  @Roles("PATIENT", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  caregivers(@Param("id") id: string) {
    return this.hah.listCaregivers(id);
  }

  @Post("episodes/:id/caregivers")
  @Roles("PATIENT", "COORDINATOR", "SUPER_ADMIN")
  grantCaregiver(
    @Param("id") id: string,
    @Body() dto: GrantCaregiverAccessDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.grantCaregiverAccess(id, dto, u.id);
  }

  @Patch("episodes/:id/caregivers/:caregiverId/revoke")
  @Roles("PATIENT", "COORDINATOR", "SUPER_ADMIN")
  revokeCaregiver(
    @Param("id") id: string,
    @Param("caregiverId") caregiverId: string,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.revokeCaregiverAccess(id, caregiverId, u.id);
  }

  @Get("episodes/:id/messages")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  messages(@Param("id") id: string) {
    return this.hah.listMessages(id);
  }

  @Post("episodes/:id/messages")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  sendMessage(
    @Param("id") id: string,
    @Body() dto: SendClinicalMessageDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.sendMessage(id, dto, u.id);
  }

  @Get("protocols/active")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  activeProtocol() {
    return this.hah.activeProtocol();
  }

  @Get("protocols")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  protocols() {
    return this.hah.listProtocols();
  }

  @Post("protocols/:id/approve")
  @Roles("SUPER_ADMIN")
  approveProtocol(
    @Param("id") id: string,
    @Body() dto: ApproveClinicalProtocolDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.approveProtocol(id, dto, u.id);
  }

  @Post("break-glass/:episodeId")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  breakGlass(
    @Param("episodeId") episodeId: string,
    @Body() dto: BreakGlassAccessDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createBreakGlassAccess(episodeId, dto, u.id);
  }

  @Patch("episodes/:id/messages/:messageId/read")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  readMessage(@Param("messageId") messageId: string) {
    return this.hah.markMessageRead(messageId);
  }

  @Post("protocols")
  @Roles("SUPER_ADMIN")
  createProtocol(
    @Body() dto: CreateClinicalProtocolDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createProtocol(dto, u.id);
  }

  @Get("alerts/open")
  @Roles("HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN")
  alerts() {
    return this.hah.listOpenAlerts();
  }
}
