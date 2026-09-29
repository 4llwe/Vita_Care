CREATE TYPE "HaHAllergySeverity" AS ENUM (
  'MILD',
  'MODERATE',
  'SEVERE',
  'UNKNOWN'
);

CREATE TABLE "HaHAllergy" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "substance" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'DRUG',
  "reaction" TEXT NOT NULL,
  "severity" "HaHAllergySeverity" NOT NULL DEFAULT 'UNKNOWN',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "recordedById" TEXT NOT NULL,
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HaHAllergy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHAllergy_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "HaHPatient"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHAllergy_patientId_status_idx"
  ON "HaHAllergy"("patientId", "status");

CREATE TABLE "HaHMedicationReconciliation" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "transitionType" TEXT NOT NULL,
  "informationSources" JSONB NOT NULL,
  "homeMedications" JSONB NOT NULL,
  "discrepancies" JSONB NOT NULL,
  "actionsTaken" TEXT NOT NULL,
  "patientOrCaregiverInvolved" BOOLEAN NOT NULL DEFAULT false,
  "completedById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHMedicationReconciliation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHMedicationReconciliation_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHMedicationReconciliation_episodeId_completedAt_idx"
  ON "HaHMedicationReconciliation"("episodeId", "completedAt");