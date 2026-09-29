import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { CAREGIVER_SCOPES } from "../caregiver-scope";

export class CreatePatientDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsDateString() dateOfBirth!: string;
  @IsIn(["MALE", "FEMALE", "INTERSEX", "UNKNOWN"]) sexAtBirth!: string;
  @IsOptional() @IsString() nationalId?: string;
  @IsOptional() @IsString() portalUserId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MinLength(5) address!: string;
  @IsString() zone!: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsArray() allergies?: string[];
}

export class CreateEpisodeDto {
  @IsString() patientId!: string;
  @IsString() admissionSource!: string;
  @IsOptional() @IsString() referringFacility?: string;
  @IsOptional() @IsString() referringClinician?: string;
  @IsString() attendingPhysicianId!: string;
  @IsString() @MinLength(3) primaryDiagnosis!: string;
  @IsOptional() @IsArray() comorbidities?: string[];
  @IsOptional() @IsIn(["ACUTE_STABLE", "MODERATE"]) acuityLevel?: string;
  @IsString() zone!: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) expectedLengthOfStayDays?: number;
  @IsOptional() @IsString() caregiverName?: string;
  @IsOptional() @IsString() caregiverPhone?: string;
}

export class AssessEligibilityDto {
  @IsBoolean() age18OrOlder!: boolean;
  @IsBoolean() acuteHospitalLevelNeed!: boolean;
  @IsBoolean() clinicallyStableForHome!: boolean;
  @IsBoolean() noImmediateProcedureNeed!: boolean;
  @IsNumber() @Min(0) @Max(15) oxygenRequirementLpm!: number;
  @IsBoolean() homeEnvironmentSafe!: boolean;
  @IsBoolean() withinServiceArea!: boolean;
  @IsBoolean() reliableCommunication!: boolean;
  @IsBoolean() patientConsents!: boolean;
  @IsOptional() @IsBoolean() caregiverAvailable?: boolean;
  @IsOptional() @IsBoolean() clinicianOverride?: boolean;
  @IsOptional() @IsString() @MinLength(10) overrideReason?: string;
}

export class AdmitEpisodeDto {
  @IsDateString() consentAt!: string;
  @IsString() @MinLength(2) consentBy!: string;
  @IsString() @MinLength(20) emergencyPlan!: string;
}

export class CarePlanDto {
  @IsOptional() @IsString() diagnosis?: string;
  @IsArray() @ArrayMinSize(1) goals!: string[];
  @IsArray() @ArrayMinSize(1) interventions!: string[];
  @IsOptional() @IsArray() doctorInterventions?: string[];
  @IsOptional() @IsArray() nursingInterventions?: string[];
  @IsOptional() @IsString() dietPlan?: string;
  @IsOptional() @IsString() activityPlan?: string;
  @IsOptional() @IsString() educationPlan?: string;
  @IsOptional() @IsString() followUpPlan?: string;
  @IsOptional() @IsString() evaluationTarget?: string;
  @IsString() visitFrequency!: string;
  @IsString() monitoringFrequency!: string;
  @IsString() @MinLength(20) escalationPlan!: string;
  @IsOptional() @IsString() medicationPlan?: string;
  @IsOptional() @IsString() equipmentPlan?: string;
  @IsDateString() nextReviewAt!: string;
}

export class CreateClinicalEvaluationDto {
  @IsString() @MinLength(20) clinicalSummary!: string;
  @IsString() @MinLength(20) progressNotes!: string;
  @IsArray() @ArrayMinSize(1) goalsMet!: string[];
  @IsOptional() @IsArray() unmetGoals?: string[];
  @IsIn([
    "CONTINUE_CARE",
    "MODIFY_CARE_PLAN",
    "DISCHARGE_READY",
    "TRANSFER_RECOMMENDED",
  ])
  disposition!: string;
  @IsOptional() @IsString() followUpRequired?: string;
}

export class CreateEmergencyEventDto {
  @IsIn(["MEDICAL_TEAM", "HOSPITAL", "AMBULANCE", "LOCATION_SHARED"])
  action!: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsString() note?: string;
}

export class ResolveEmergencyEventDto {
  @IsString() @MinLength(5) resolution!: string;
}

export class RecordObservationDto {
  @IsInt() @Min(40) @Max(300) systolic!: number;
  @IsInt() @Min(20) @Max(200) diastolic!: number;
  @IsInt() @Min(20) @Max(250) heartRate!: number;
  @IsInt() @Min(4) @Max(60) respRate!: number;
  @IsNumber() @Min(30) @Max(45) temperature!: number;
  @IsInt() @Min(50) @Max(100) spo2!: number;
  @IsBoolean() supplementalOxygen!: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(15) oxygenFlowLpm?: number;
  @IsIn([1, 2]) spo2Scale!: 1 | 2;
  @IsIn(["A", "V", "P", "U"]) consciousness!: "A" | "V" | "P" | "U";
  @IsBoolean() newConfusion!: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(10) painScore?: number;
  @IsOptional() @IsNumber() @Min(20) @Max(600) glucoseMgDl?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(500) weightKg?: number;
  @IsOptional() @IsString() symptomNotes?: string;
}

export class ResolveAlertDto {
  @IsString() @MinLength(5) resolution!: string;
}

export class TransferDto {
  @IsString() destination!: string;
  @IsString() @MinLength(5) reason!: string;
  @IsIn(["URGENT", "EMERGENCY"]) urgency!: string;
  @IsString() @MinLength(20) sbarHandover!: string;
  @IsOptional() @IsString() transportProvider?: string;
}

export class DischargeDto {
  @IsString() dischargeDisposition!: string;
  @IsString() @MinLength(30) dischargeSummary!: string;
}

export class CreateMedicationOrderDto {
  @IsString() @MinLength(2) medicationName!: string;
  @IsString() dose!: string;
  @IsString() route!: string;
  @IsString() frequency!: string;
  @IsString() @MinLength(3) indication!: string;
  @IsDateString() startAt!: string;
  @IsOptional() @IsDateString() endAt?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsDateString({}, { each: true })
  scheduleAt?: string[];
}

export class AdministerMedicationDto {
  @IsDateString() scheduledAt!: string;
  @IsIn(["GIVEN", "OMITTED", "REFUSED", "DELAYED"]) status!: string;
  @IsOptional() @IsDateString() administeredAt?: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateMedicationStatusDto {
  @IsIn(["ACTIVE", "HELD", "COMPLETED", "CANCELLED"]) status!: string;
}

export class CreateMedicationFulfillmentDto {
  @IsString() @MinLength(1) quantity!: string;
  @IsString() @MinLength(10) deliveryAddress!: string;
  @IsOptional() @IsString() requestNote?: string;
}

export class UpdateMedicationFulfillmentDto {
  @IsIn([
    "CLINICAL_REVIEW",
    "APPROVED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ])
  status!: string;
  @IsOptional() @IsString() courierName?: string;
  @IsOptional() @IsString() trackingNote?: string;
  @IsOptional() @IsString() cancellationReason?: string;
}

export class AssignCareTeamDto {
  @IsString() healthWorkerId!: string;
  @IsIn(["PRIMARY_CLINICIAN", "CARE_COORDINATOR"]) type!: string;
  @IsString() @MinLength(5) responsibility!: string;
  @IsDateString() startsAt!: string;
  @IsOptional() @IsDateString() endsAt?: string;
}

export class EndCareAssignmentDto {
  @IsString() @MinLength(5) reason!: string;
}

export class CreateClinicalTaskDto {
  @IsString() @MinLength(3) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsIn([
    "ASSESSMENT",
    "VITALS",
    "MEDICATION",
    "WOUND_CARE",
    "EDUCATION",
    "FOLLOW_UP",
    "OTHER",
  ])
  category!: string;
  @IsIn(["ROUTINE", "URGENT", "STAT"]) priority!: string;
  @IsString() assignedToHealthWorkerId!: string;
  @IsDateString() dueAt!: string;
}

export class UpdateClinicalTaskDto {
  @IsIn(["IN_PROGRESS", "COMPLETED", "OMITTED", "CANCELLED"])
  status!: string;
  @IsOptional() @IsString() outcomeNote?: string;
  @IsOptional() @IsString() handoverNote?: string;
}

export class CreateVisitDto {
  @IsString() healthWorkerId!: string;
  @IsString() visitType!: string;
  @IsDateString() scheduledStart!: string;
  @IsDateString() scheduledEnd!: string;
}

export class UpdateVisitStatusDto {
  @IsIn(["PLANNED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  status!: string;
  @IsOptional() @IsString() handoverNote?: string;
}

export class CreateWoundAssessmentDto {
  @IsString() @MinLength(2) woundLabel!: string;
  @IsString() @MinLength(2) location!: string;
  @IsString() @MinLength(2) woundType!: string;
  @IsOptional() @IsNumber() @Min(0) lengthCm?: number;
  @IsOptional() @IsNumber() @Min(0) widthCm?: number;
  @IsOptional() @IsNumber() @Min(0) depthCm?: number;
  @IsString() @MinLength(3) tissueDescription!: string;
  @IsString() @MinLength(2) exudate!: string;
  @IsBoolean() odor!: boolean;
  @IsString() @MinLength(3) surroundingSkin!: string;
  @IsInt() @Min(0) @Max(10) painScore!: number;
  @IsBoolean() infectionSigns!: boolean;
  @IsIn(["IMPROVING", "STABLE", "DETERIORATING", "HEALED"])
  progress!: string;
  @IsOptional() @IsString() cleansing?: string;
  @IsString() @MinLength(2) dressing!: string;
  @IsOptional() @IsString() education?: string;
  @IsDateString() nextReviewAt!: string;
}

export class CreateFunctionalAssessmentDto {
  @IsString() @MinLength(2) mobilityLevel!: string;
  @IsInt() @Min(0) @Max(100) adlScore!: number;
  @IsIn(["LOW", "MODERATE", "HIGH"]) fallRisk!: string;
  @IsInt() @Min(0) @Max(30) fallsLast30Days!: number;
  @IsOptional() @IsString() gaitAid?: string;
  @IsString() @MinLength(2) transferAbility!: string;
  @IsOptional() @IsString() enduranceNotes?: string;
  @IsOptional() @IsString() homeHazards?: string;
  @IsString() @MinLength(5) rehabilitationGoals!: string;
  @IsString() @MinLength(5) exercisePlan!: string;
  @IsOptional() @IsString() caregiverTraining?: string;
  @IsIn(["IMPROVING", "STABLE", "DECLINING", "GOAL_ACHIEVED"])
  progress!: string;
  @IsDateString() nextReviewAt!: string;
}

export class CreateNutritionAssessmentDto {
  @IsNumber() @Min(1) @Max(500) weightKg!: number;
  @IsNumber() @Min(30) @Max(250) heightCm!: number;
  @IsOptional() @IsNumber() @Min(-100) @Max(100) weightChangePercent?: number;
  @IsInt() @Min(0) @Max(100) intakePercent!: number;
  @IsString() @MinLength(2) appetite!: string;
  @IsBoolean() swallowingDifficulty!: boolean;
  @IsBoolean() nauseaVomiting!: boolean;
  @IsIn(["LOW", "MODERATE", "HIGH"]) nutritionRisk!: string;
  @IsString() @MinLength(5) dietPlan!: string;
  @IsOptional() @IsNumber() @Min(0) proteinTargetG?: number;
  @IsOptional() @IsInt() @Min(0) fluidTargetMl?: number;
  @IsOptional() @IsString() supplements?: string;
  @IsOptional() @IsString() education?: string;
  @IsDateString() nextReviewAt!: string;
}

export class CreatePalliativeAssessmentDto {
  @IsInt() @Min(0) @Max(100) ppsScore!: number;
  @IsInt() @Min(0) @Max(10) painScore!: number;
  @IsInt() @Min(0) @Max(10) dyspneaScore!: number;
  @IsInt() @Min(0) @Max(10) nauseaScore!: number;
  @IsInt() @Min(0) @Max(10) anxietyScore!: number;
  @IsString() @MinLength(3) consciousnessNotes!: string;
  @IsOptional() @IsString() otherSymptoms?: string;
  @IsString() @MinLength(10) goalsOfCare!: string;
  @IsString() @MinLength(3) preferredPlaceOfCare!: string;
  @IsString() @MinLength(10) escalationPreferences!: string;
  @IsString() @MinLength(10) comfortPlan!: string;
  @IsOptional() @IsString() familyDiscussionSummary?: string;
  @IsOptional() @IsString() spiritualPsychosocialNeed?: string;
  @IsDateString() nextReviewAt!: string;
}

export class CreateEducationRecordDto {
  @IsString() @MinLength(3) topic!: string;
  @IsIn(["PATIENT", "CAREGIVER", "BOTH"]) audience!: string;
  @IsString() @MinLength(10) contentSummary!: string;
  @IsString() @MinLength(2) deliveryMethod!: string;
  @IsString() @MinLength(2) language!: string;
  @IsString() @MinLength(5) teachBackResponse!: string;
  @IsIn(["UNDERSTOOD", "PARTIAL", "NEEDS_REINFORCEMENT"])
  comprehension!: string;
  @IsOptional() @IsString() barriers?: string;
  @IsOptional() @IsString() reinforcementPlan?: string;
  @IsOptional() @IsString() educationalMaterial?: string;
  @IsOptional() @IsDateString() nextReviewAt?: string;
}

export class CreateDiagnosticOrderDto {
  @IsString() category!: string;
  @IsString() @MinLength(2) testName!: string;
  @IsOptional() @IsString() specimen?: string;
  @IsIn(["ROUTINE", "URGENT", "STAT"]) priority!: string;
}
export class DiagnosticResultDto {
  @IsOptional() @IsString() resultValue?: string;
  @IsOptional() @IsString() resultUnit?: string;
  @IsOptional() @IsString() referenceRange?: string;
  @IsIn(["NORMAL", "LOW", "HIGH", "ABNORMAL", "INDETERMINATE"])
  resultFlag!: string;
  @IsString() @MinLength(3) resultText!: string;
  @IsBoolean() criticalResult!: boolean;
}
export class UpdateDiagnosticStatusDto {
  @IsIn(["COLLECTED", "PROCESSING", "CANCELLED"]) status!: string;
  @IsOptional() @IsString() collectionNote?: string;
  @IsOptional() @IsString() cancellationReason?: string;
}
export class AcknowledgeDiagnosticDto {
  @IsString() @MinLength(3) acknowledgementNote!: string;
}
export class CreateEquipmentAssignmentDto {
  @IsString() equipmentType!: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() supplier?: string;
  @IsOptional() @IsString() instructions?: string;
}
export class UpdateEquipmentStatusDto {
  @IsIn(["REQUESTED", "DELIVERED", "IN_USE", "RETURNED", "CANCELLED"])
  status!: string;
}

export class GrantCaregiverAccessDto {
  @IsOptional() @IsString() caregiverUserId?: string;
  @IsOptional() @IsEmail() caregiverEmail?: string;
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(CAREGIVER_SCOPES, { each: true })
  scope!: string[];
  @IsString() @MinLength(2) consentBy!: string;
  @IsDateString() consentAt!: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
export class SendClinicalMessageDto {
  @IsString() @MinLength(2) body!: string;
  @IsOptional()
  @IsIn(["GENERAL", "CARE_INSTRUCTION", "SYMPTOM_REPORT", "MEDICATION", "FOLLOW_UP"])
  category?: string;
  @IsOptional() @IsIn(["ROUTINE", "URGENT"]) priority?: string;
  @IsOptional() @IsArray() attachmentUrls?: string[];
}
export class CreateClinicalProtocolDto {
  @IsString() @MinLength(3) name!: string;
  @IsObject() thresholds!: Record<string, unknown>;
  @IsObject() responseSla!: Record<string, unknown>;
  @IsString() @MinLength(5) approvalNote!: string;
  @IsDateString() activeFrom!: string;
}

export class ApproveClinicalProtocolDto {
  @IsIn(["APPROVE", "REJECT"]) decision!: string;
  @IsString() @MinLength(5) note!: string;
}
export class BreakGlassAccessDto {
  @IsString() @MinLength(20) reason!: string;
  @IsInt() @Min(5) @Max(60) durationMinutes!: number;
}
