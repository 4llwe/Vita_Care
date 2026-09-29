-- Structured diagnostic workflow and laboratory result safety metadata.
CREATE TYPE "DiagnosticResultFlag" AS ENUM (
  'NORMAL',
  'LOW',
  'HIGH',
  'ABNORMAL',
  'INDETERMINATE'
);

ALTER TABLE "HaHDiagnosticOrder"
  ADD COLUMN "collectedById" TEXT,
  ADD COLUMN "collectionNote" TEXT,
  ADD COLUMN "processingAt" TIMESTAMP(3),
  ADD COLUMN "resultedById" TEXT,
  ADD COLUMN "resultValue" TEXT,
  ADD COLUMN "resultUnit" TEXT,
  ADD COLUMN "referenceRange" TEXT,
  ADD COLUMN "resultFlag" "DiagnosticResultFlag",
  ADD COLUMN "acknowledgementNote" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "HaHDiagnosticOrder_status_priority_orderedAt_idx"
  ON "HaHDiagnosticOrder"("status", "priority", "orderedAt");