-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COORDINATOR', 'HEALTH_WORKER', 'AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'PATIENT', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DIPESAN', 'DIKONFIRMASI', 'DITUGASKAN', 'DALAM_PERJALANAN', 'BERLANGSUNG', 'SELESAI', 'DIEVALUASI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('MINOR', 'MAYOR', 'CRITICAL', 'FRAUD_INDICATOR', 'COMPLIANCE_BREACH');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'MITIGATING', 'CLOSED');

-- CreateEnum
CREATE TYPE "CapaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'VERIFIED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReferralUrgency" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('CLINICAL', 'OPERATIONAL', 'COMPLIANCE', 'SAFETY', 'DOCUMENTATION');

-- CreateEnum
CREATE TYPE "AuditExecutionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ComplianceResult" AS ENUM ('COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "HaHEpisodeStatus" AS ENUM ('SCREENING', 'ELIGIBLE', 'INELIGIBLE', 'ADMITTED', 'ACTIVE', 'TRANSFER_REQUESTED', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HaHEligibilityDecision" AS ENUM ('PENDING', 'ELIGIBLE', 'INELIGIBLE', 'OVERRIDE_ELIGIBLE');

-- CreateEnum
CREATE TYPE "ClinicalAlertSeverity" AS ENUM ('MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ClinicalAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "HaHVisitStatus" AS ENUM ('PLANNED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MedicationOrderStatus" AS ENUM ('ACTIVE', 'HELD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiagnosticOrderStatus" AS ENUM ('ORDERED', 'COLLECTED', 'PROCESSING', 'RESULTED', 'ACKNOWLEDGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EquipmentAssignmentStatus" AS ENUM ('REQUESTED', 'DELIVERED', 'IN_USE', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "twoFaSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'per kunjungan',

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthWorker" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "licenseValidUntil" TIMESTAMP(3) NOT NULL,
    "zone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HealthWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientPhone" TEXT,
    "serviceId" TEXT NOT NULL,
    "healthWorkerId" TEXT,
    "zone" TEXT NOT NULL,
    "addressLat" DOUBLE PRECISION,
    "addressLng" DOUBLE PRECISION,
    "workerLat" DOUBLE PRECISION,
    "workerLng" DOUBLE PRECISION,
    "workerLocAt" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'DIPESAN',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "subjective" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "heartRate" INTEGER,
    "respRate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "spo2" INTEGER,
    "consciousness" TEXT,
    "ewsScore" INTEGER NOT NULL DEFAULT 0,
    "ewsRisk" TEXT NOT NULL DEFAULT 'low',
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bookingId" TEXT,
    "patientName" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "midtransOrderId" TEXT,
    "snapToken" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" TEXT,
    "grossAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "transactionTime" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "rootCause" TEXT,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "picId" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditAnswerId" TEXT,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capa" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "CapaStatus" NOT NULL DEFAULT 'OPEN',
    "evidenceUrl" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "picId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRegister" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "RiskLevel" NOT NULL,
    "mitigation" TEXT,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT,
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "bookingId" TEXT,
    "toHospital" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" "ReferralUrgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "ReferralStatus" NOT NULL DEFAULT 'REQUESTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChecklist" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "guidance" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditExecution" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "auditeeUnit" TEXT NOT NULL,
    "zone" TEXT,
    "auditorId" TEXT,
    "status" "AuditExecutionStatus" NOT NULL DEFAULT 'DRAFT',
    "scorePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditAnswer" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "result" "ComplianceResult" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "answerId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "caption" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHPatient" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "portalUserId" TEXT,
    "nationalId" TEXT,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sexAtBirth" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "allergies" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaHPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHEpisode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "HaHEpisodeStatus" NOT NULL DEFAULT 'SCREENING',
    "admissionSource" TEXT NOT NULL,
    "referringFacility" TEXT,
    "referringClinician" TEXT,
    "attendingPhysicianId" TEXT NOT NULL,
    "primaryDiagnosis" TEXT NOT NULL,
    "comorbidities" JSONB,
    "acuityLevel" TEXT NOT NULL DEFAULT 'ACUTE_STABLE',
    "zone" TEXT NOT NULL,
    "expectedLengthOfStayDays" INTEGER,
    "consentAt" TIMESTAMP(3),
    "consentBy" TEXT,
    "caregiverName" TEXT,
    "caregiverPhone" TEXT,
    "emergencyPlan" TEXT,
    "admissionAt" TIMESTAMP(3),
    "dischargeAt" TIMESTAMP(3),
    "dischargeDisposition" TEXT,
    "dischargeSummary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaHEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHEligibilityAssessment" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "age18OrOlder" BOOLEAN NOT NULL,
    "acuteHospitalLevelNeed" BOOLEAN NOT NULL,
    "clinicallyStableForHome" BOOLEAN NOT NULL,
    "noImmediateProcedureNeed" BOOLEAN NOT NULL,
    "oxygenRequirementLpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "homeEnvironmentSafe" BOOLEAN NOT NULL,
    "withinServiceArea" BOOLEAN NOT NULL,
    "reliableCommunication" BOOLEAN NOT NULL,
    "patientConsents" BOOLEAN NOT NULL,
    "caregiverAvailable" BOOLEAN,
    "exclusionReasons" JSONB,
    "decision" "HaHEligibilityDecision" NOT NULL,
    "overrideReason" TEXT,
    "assessedById" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHEligibilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHCarePlan" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "diagnosis" TEXT,
    "goals" JSONB NOT NULL,
    "interventions" JSONB NOT NULL,
    "doctorInterventions" JSONB,
    "nursingInterventions" JSONB,
    "dietPlan" TEXT,
    "activityPlan" TEXT,
    "educationPlan" TEXT,
    "followUpPlan" TEXT,
    "evaluationTarget" TEXT,
    "visitFrequency" TEXT NOT NULL,
    "monitoringFrequency" TEXT NOT NULL,
    "escalationPlan" TEXT NOT NULL,
    "medicationPlan" TEXT,
    "equipmentPlan" TEXT,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaHCarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHCarePlanRevision" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHCarePlanRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHObservation" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "systolic" INTEGER NOT NULL,
    "diastolic" INTEGER NOT NULL,
    "heartRate" INTEGER NOT NULL,
    "respRate" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "spo2" INTEGER NOT NULL,
    "supplementalOxygen" BOOLEAN NOT NULL DEFAULT false,
    "oxygenFlowLpm" DOUBLE PRECISION,
    "spo2Scale" INTEGER NOT NULL DEFAULT 1,
    "consciousness" TEXT NOT NULL,
    "newConfusion" BOOLEAN NOT NULL DEFAULT false,
    "painScore" INTEGER,
    "glucoseMgDl" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "symptomNotes" TEXT,
    "ewsScore" INTEGER NOT NULL,
    "ewsRisk" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAlert" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "observationId" TEXT,
    "severity" "ClinicalAlertSeverity" NOT NULL,
    "status" "ClinicalAlertStatus" NOT NULL DEFAULT 'OPEN',
    "trigger" TEXT NOT NULL,
    "responseDueAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "lastEscalatedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalAlertEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalAlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHCaregiverAccess" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "scope" JSONB NOT NULL,
    "consentBy" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHCaregiverAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHClinicalMessage" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "attachmentUrls" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHClinicalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHClinicalProtocol" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "thresholds" JSONB NOT NULL,
    "responseSla" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedById" TEXT,
    "approvalNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "activeFrom" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHClinicalProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHVisit" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "healthWorkerId" TEXT NOT NULL,
    "visitType" TEXT NOT NULL,
    "status" "HaHVisitStatus" NOT NULL DEFAULT 'PLANNED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "handoverNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationOrder" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "indication" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "MedicationOrderStatus" NOT NULL DEFAULT 'ACTIVE',
    "prescribedById" TEXT NOT NULL,
    "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "medicationOrderId" TEXT NOT NULL,
    "administeredById" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "administeredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHTransfer" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "sbarHandover" TEXT NOT NULL,
    "transportProvider" TEXT,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),

    CONSTRAINT "HaHTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHDiagnosticOrder" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "specimen" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "status" "DiagnosticOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "orderedById" TEXT NOT NULL,
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" TIMESTAMP(3),
    "resultedAt" TIMESTAMP(3),
    "resultText" TEXT,
    "criticalResult" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "HaHDiagnosticOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHEquipmentAssignment" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "serialNumber" TEXT,
    "supplier" TEXT,
    "status" "EquipmentAssignmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "instructions" TEXT,

    CONSTRAINT "HaHEquipmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "to" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerId" TEXT,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHClinicalProtocolApproval" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHClinicalProtocolApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaHBreakGlassAccess" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaHBreakGlassAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicServiceRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'PUBLIC_MENU',
    "assignedToId" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationMenuGroup" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationMenuGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationMenuItem" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "operationKind" TEXT NOT NULL DEFAULT 'information',
    "requestType" TEXT,
    "headline" TEXT,
    "steps" JSONB,
    "sla" TEXT,
    "hrefOverride" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationMenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HealthWorker_userId_key" ON "HealthWorker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_bookingId_key" ON "MedicalRecord"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_code_key" ON "Invoice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "Invoice"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_midtransOrderId_key" ON "Invoice"("midtransOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_code_key" ON "Finding"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Finding_auditAnswerId_key" ON "Finding"("auditAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "Capa_findingId_key" ON "Capa"("findingId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRegister_code_key" ON "RiskRegister"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Document_code_key" ON "Document"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AuditChecklist_code_key" ON "AuditChecklist"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AuditExecution_code_key" ON "AuditExecution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AuditAnswer_executionId_itemId_key" ON "AuditAnswer"("executionId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "HaHPatient_mrn_key" ON "HaHPatient"("mrn");

-- CreateIndex
CREATE UNIQUE INDEX "HaHPatient_portalUserId_key" ON "HaHPatient"("portalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "HaHPatient_nationalId_key" ON "HaHPatient"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "HaHEpisode_code_key" ON "HaHEpisode"("code");

-- CreateIndex
CREATE INDEX "HaHEpisode_status_createdAt_idx" ON "HaHEpisode"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HaHEpisode_patientId_createdAt_idx" ON "HaHEpisode"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HaHEligibilityAssessment_episodeId_key" ON "HaHEligibilityAssessment"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "HaHCarePlan_episodeId_key" ON "HaHCarePlan"("episodeId");

-- CreateIndex
CREATE INDEX "HaHCarePlanRevision_episodeId_changedAt_idx" ON "HaHCarePlanRevision"("episodeId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HaHCarePlanRevision_episodeId_version_key" ON "HaHCarePlanRevision"("episodeId", "version");

-- CreateIndex
CREATE INDEX "HaHObservation_episodeId_recordedAt_idx" ON "HaHObservation"("episodeId", "recordedAt");

-- CreateIndex
CREATE INDEX "ClinicalAlert_status_severity_responseDueAt_idx" ON "ClinicalAlert"("status", "severity", "responseDueAt");

-- CreateIndex
CREATE INDEX "ClinicalAlert_episodeId_createdAt_idx" ON "ClinicalAlert"("episodeId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalAlertEvent_alertId_createdAt_idx" ON "ClinicalAlertEvent"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "HaHCaregiverAccess_caregiverId_revokedAt_idx" ON "HaHCaregiverAccess"("caregiverId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HaHCaregiverAccess_patientId_caregiverId_key" ON "HaHCaregiverAccess"("patientId", "caregiverId");

-- CreateIndex
CREATE INDEX "HaHClinicalMessage_episodeId_createdAt_idx" ON "HaHClinicalMessage"("episodeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HaHClinicalProtocol_version_key" ON "HaHClinicalProtocol"("version");

-- CreateIndex
CREATE INDEX "HaHClinicalProtocol_status_activeFrom_idx" ON "HaHClinicalProtocol"("status", "activeFrom");

-- CreateIndex
CREATE INDEX "HaHVisit_episodeId_scheduledStart_idx" ON "HaHVisit"("episodeId", "scheduledStart");

-- CreateIndex
CREATE INDEX "HaHVisit_healthWorkerId_scheduledStart_idx" ON "HaHVisit"("healthWorkerId", "scheduledStart");

-- CreateIndex
CREATE INDEX "MedicationOrder_episodeId_status_idx" ON "MedicationOrder"("episodeId", "status");

-- CreateIndex
CREATE INDEX "MedicationAdministration_medicationOrderId_scheduledAt_idx" ON "MedicationAdministration"("medicationOrderId", "scheduledAt");

-- CreateIndex
CREATE INDEX "HaHTransfer_episodeId_requestedAt_idx" ON "HaHTransfer"("episodeId", "requestedAt");

-- CreateIndex
CREATE INDEX "HaHDiagnosticOrder_episodeId_status_idx" ON "HaHDiagnosticOrder"("episodeId", "status");

-- CreateIndex
CREATE INDEX "HaHEquipmentAssignment_episodeId_status_idx" ON "HaHEquipmentAssignment"("episodeId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_nextAttemptAt_idx" ON "NotificationDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "HaHClinicalProtocolApproval_protocolId_createdAt_idx" ON "HaHClinicalProtocolApproval"("protocolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HaHClinicalProtocolApproval_protocolId_approverId_key" ON "HaHClinicalProtocolApproval"("protocolId", "approverId");

-- CreateIndex
CREATE INDEX "HaHBreakGlassAccess_userId_expiresAt_revokedAt_idx" ON "HaHBreakGlassAccess"("userId", "expiresAt", "revokedAt");

-- CreateIndex
CREATE INDEX "PublicServiceRequest_status_createdAt_idx" ON "PublicServiceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PublicServiceRequest_type_section_idx" ON "PublicServiceRequest"("type", "section");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationMenuGroup_key_key" ON "NavigationMenuGroup"("key");

-- CreateIndex
CREATE INDEX "NavigationMenuGroup_isActive_sortOrder_idx" ON "NavigationMenuGroup"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "NavigationMenuItem_isActive_sortOrder_idx" ON "NavigationMenuItem"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationMenuItem_groupId_slug_key" ON "NavigationMenuItem"("groupId", "slug");

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthWorker" ADD CONSTRAINT "HealthWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_healthWorkerId_fkey" FOREIGN KEY ("healthWorkerId") REFERENCES "HealthWorker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_picId_fkey" FOREIGN KEY ("picId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_auditAnswerId_fkey" FOREIGN KEY ("auditAnswerId") REFERENCES "AuditAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_picId_fkey" FOREIGN KEY ("picId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRegister" ADD CONSTRAINT "RiskRegister_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "AuditChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditExecution" ADD CONSTRAINT "AuditExecution_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "AuditChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditExecution" ADD CONSTRAINT "AuditExecution_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditAnswer" ADD CONSTRAINT "AuditAnswer_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AuditExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditAnswer" ADD CONSTRAINT "AuditAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AuditExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "AuditAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHEpisode" ADD CONSTRAINT "HaHEpisode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "HaHPatient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHEligibilityAssessment" ADD CONSTRAINT "HaHEligibilityAssessment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHCarePlan" ADD CONSTRAINT "HaHCarePlan_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHCarePlanRevision" ADD CONSTRAINT "HaHCarePlanRevision_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHObservation" ADD CONSTRAINT "HaHObservation_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAlert" ADD CONSTRAINT "ClinicalAlert_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAlert" ADD CONSTRAINT "ClinicalAlert_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "HaHObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalAlertEvent" ADD CONSTRAINT "ClinicalAlertEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "ClinicalAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHCaregiverAccess" ADD CONSTRAINT "HaHCaregiverAccess_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "HaHPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHCaregiverAccess" ADD CONSTRAINT "HaHCaregiverAccess_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHClinicalMessage" ADD CONSTRAINT "HaHClinicalMessage_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHClinicalMessage" ADD CONSTRAINT "HaHClinicalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHVisit" ADD CONSTRAINT "HaHVisit_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHVisit" ADD CONSTRAINT "HaHVisit_healthWorkerId_fkey" FOREIGN KEY ("healthWorkerId") REFERENCES "HealthWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHTransfer" ADD CONSTRAINT "HaHTransfer_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHDiagnosticOrder" ADD CONSTRAINT "HaHDiagnosticOrder_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHEquipmentAssignment" ADD CONSTRAINT "HaHEquipmentAssignment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHClinicalProtocolApproval" ADD CONSTRAINT "HaHClinicalProtocolApproval_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "HaHClinicalProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHClinicalProtocolApproval" ADD CONSTRAINT "HaHClinicalProtocolApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHBreakGlassAccess" ADD CONSTRAINT "HaHBreakGlassAccess_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaHBreakGlassAccess" ADD CONSTRAINT "HaHBreakGlassAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationMenuItem" ADD CONSTRAINT "NavigationMenuItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "NavigationMenuGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

