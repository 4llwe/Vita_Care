CREATE TYPE "TeleconsultationStatus" AS ENUM (
  'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
);

CREATE TABLE "HaHTeleconsultation" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "clinicianId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "scheduledStart" TIMESTAMP(3) NOT NULL,
  "scheduledEnd" TIMESTAMP(3) NOT NULL,
  "meetingUrl" TEXT,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "consentBy" TEXT NOT NULL,
  "status" "TeleconsultationStatus" NOT NULL DEFAULT 'SCHEDULED',
  "identityVerifiedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "clinicalSummary" TEXT,
  "advice" TEXT,
  "escalationRequired" BOOLEAN NOT NULL DEFAULT false,
  "escalationPlan" TEXT,
  "followUpPlan" TEXT,
  "cancellationReason" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHTeleconsultation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHTeleconsultation_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHTeleconsultation_episodeId_scheduledStart_idx"
  ON "HaHTeleconsultation"("episodeId", "scheduledStart");
CREATE INDEX "HaHTeleconsultation_clinicianId_status_scheduledStart_idx"
  ON "HaHTeleconsultation"("clinicianId", "status", "scheduledStart");