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
import { HaHEpisodeStatus } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
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
  ResolveAlertDto,
  SendClinicalMessageDto,
  TransferDto,
  UpdateEquipmentStatusDto,
  UpdateMedicationStatusDto,
  UpdateVisitStatusDto,
} from "./dto/hah.dto";
import { HaHService } from "./hah.service";
import { HaHAccessGuard } from "./hah-access.guard";

@Controller("hah")
@UseGuards(JwtAuthGuard, HaHAccessGuard, RolesGuard)
export class HaHController {
  constructor(private readonly hah: HaHService) {}

  @Post("patients")
  @Roles("COORDINATOR", "HEALTH_WORKER", "SUPER_ADMIN")
  createPatient(@Body() dto: CreatePatientDto) {
    return this.hah.createPatient(dto);
  }

  @Post("episodes")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  createEpisode(@Body() dto: CreateEpisodeDto, @CurrentUser() u: { id: string }) {
    return this.hah.createEpisode(dto, u.id);
  }

  @Post("episodes/:id/eligibility")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  assess(
    @Param("id") id: string,
    @Body() dto: AssessEligibilityDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.assessEligibility(id, dto, u.id);
  }

  @Post("episodes/:id/admit")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  admit(@Param("id") id: string, @Body() dto: AdmitEpisodeDto) {
    return this.hah.admit(id, dto);
  }

  @Post("episodes/:id/care-plan")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  carePlan(
    @Param("id") id: string,
    @Body() dto: CarePlanDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.upsertCarePlan(id, dto, u.id);
  }

  @Post("episodes/:id/observations")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  observation(
    @Param("id") id: string,
    @Body() dto: RecordObservationDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.recordObservation(id, dto, u.id);
  }

  @Patch("alerts/:id/acknowledge")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  acknowledge(@Param("id") id: string, @CurrentUser() u: { id: string }) {
    return this.hah.acknowledgeAlert(id, u.id);
  }

  @Patch("alerts/:id/resolve")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  resolve(
    @Param("id") id: string,
    @Body() dto: ResolveAlertDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.resolveAlert(id, u.id, dto.resolution);
  }

  @Post("episodes/:id/transfer")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  transfer(
    @Param("id") id: string,
    @Body() dto: TransferDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.transfer(id, dto, u.id);
  }

  @Patch("transfers/:id/arrive")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  completeTransfer(@Param("id") id: string) {
    return this.hah.completeTransfer(id);
  }

  @Post("episodes/:id/discharge")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  discharge(@Param("id") id: string, @Body() dto: DischargeDto) {
    return this.hah.discharge(id, dto);
  }

  @Post("episodes/:id/diagnostics")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  diagnostic(
    @Param("id") id: string,
    @Body() dto: CreateDiagnosticOrderDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createDiagnosticOrder(id, dto, u.id);
  }

  @Patch("diagnostics/:id/result")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  diagnosticResult(@Param("id") id: string, @Body() dto: DiagnosticResultDto) {
    return this.hah.resultDiagnostic(id, dto);
  }

  @Patch("diagnostics/:id/acknowledge")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  diagnosticAck(@Param("id") id: string, @CurrentUser() u: { id: string }) {
    return this.hah.acknowledgeDiagnostic(id, u.id);
  }

  @Post("episodes/:id/equipment")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  equipment(
    @Param("id") id: string,
    @Body() dto: CreateEquipmentAssignmentDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.assignEquipment(id, dto, u.id);
  }

  @Patch("equipment/:id/status")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  equipmentStatus(@Param("id") id: string, @Body() dto: UpdateEquipmentStatusDto) {
    return this.hah.updateEquipment(id, dto);
  }

  @Get("patients")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  patients(@Query("q") query?: string) {
    return this.hah.listPatients(query);
  }

  @Post("episodes/:id/medications")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  medication(
    @Param("id") id: string,
    @Body() dto: CreateMedicationOrderDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createMedicationOrder(id, dto, u.id);
  }

  @Patch("medications/:id/status")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  medicationStatus(@Param("id") id: string, @Body() dto: UpdateMedicationStatusDto) {
    return this.hah.updateMedicationStatus(id, dto);
  }

  @Post("medications/:id/administrations")
  @Roles("HEALTH_WORKER", "SUPER_ADMIN")
  administer(
    @Param("id") id: string,
    @Body() dto: AdministerMedicationDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.administerMedication(id, dto, u.id);
  }

  @Post("episodes/:id/visits")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  visit(@Param("id") id: string, @Body() dto: CreateVisitDto) {
    return this.hah.createVisit(id, dto);
  }

  @Patch("visits/:id/status")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  visitStatus(@Param("id") id: string, @Body() dto: UpdateVisitStatusDto) {
    return this.hah.updateVisit(id, dto);
  }

  @Get("episodes")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  list(
    @CurrentUser() u: { id: string; role: string },
    @Query("status") status?: HaHEpisodeStatus,
  ) {
    return this.hah.listEpisodes(status, u);
  }

  @Get("episodes/:id")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  get(@Param("id") id: string, @CurrentUser() u: { id: string; role: string }) {
    return this.hah.getEpisode(id, u);
  }

  @Get("episodes/:id/caregivers")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
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
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  messages(@Param("id") id: string) {
    return this.hah.listMessages(id);
  }

  @Post("episodes/:id/messages")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  sendMessage(
    @Param("id") id: string,
    @Body() dto: SendClinicalMessageDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.sendMessage(id, dto, u.id);
  }

  @Get("protocols/active")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  activeProtocol() {
    return this.hah.activeProtocol();
  }

  @Get("protocols")
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
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
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  breakGlass(
    @Param("episodeId") episodeId: string,
    @Body() dto: BreakGlassAccessDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.hah.createBreakGlassAccess(episodeId, dto, u.id);
  }

  @Patch("episodes/:id/messages/:messageId/read")
  @Roles("PATIENT", "CAREGIVER", "HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
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
  @Roles("HEALTH_WORKER", "COORDINATOR", "SUPER_ADMIN")
  alerts() {
    return this.hah.listOpenAlerts();
  }
}
