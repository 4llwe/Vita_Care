import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
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

export class CreateDiagnosticOrderDto {
  @IsString() category!: string;
  @IsString() @MinLength(2) testName!: string;
  @IsOptional() @IsString() specimen?: string;
  @IsIn(["ROUTINE", "URGENT", "STAT"]) priority!: string;
}
export class DiagnosticResultDto {
  @IsString() @MinLength(1) resultText!: string;
  @IsBoolean() criticalResult!: boolean;
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
  @IsString() caregiverUserId!: string;
  @IsArray() @ArrayMinSize(1) scope!: string[];
  @IsString() @MinLength(2) consentBy!: string;
  @IsDateString() consentAt!: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}
export class SendClinicalMessageDto {
  @IsString() @MinLength(2) body!: string;
  @IsOptional()
  @IsIn(["GENERAL", "CARE_INSTRUCTION", "SYMPTOM_REPORT", "MEDICATION", "FOLLOW_UP"])
  category?: string;
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
