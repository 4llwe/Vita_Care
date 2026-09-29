ALTER TABLE "HaHVisit"
  ADD COLUMN "identityVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "clinicalNote" TEXT,
  ADD COLUMN "interventions" TEXT,
  ADD COLUMN "patientResponse" TEXT,
  ADD COLUMN "nextPlan" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledById" TEXT;