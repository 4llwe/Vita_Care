ALTER TABLE "MedicationAdministration"
  ADD COLUMN "scheduledById" TEXT,
  ADD COLUMN "reminderSentAt" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "MedicationAdministration"
SET "scheduledById" = "administeredById"
WHERE "scheduledById" IS NULL;

ALTER TABLE "MedicationAdministration"
  ALTER COLUMN "scheduledById" SET NOT NULL,
  ALTER COLUMN "administeredById" DROP NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'PLANNED';

CREATE INDEX "MedicationAdministration_status_scheduledAt_idx"
  ON "MedicationAdministration"("status", "scheduledAt");