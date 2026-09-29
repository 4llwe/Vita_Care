CREATE TYPE "HaHTransferStatus" AS ENUM (
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'DEPARTED',
  'ARRIVED',
  'CANCELLED'
);

ALTER TABLE "HaHTransfer"
  ADD COLUMN "destinationUnit" TEXT,
  ADD COLUMN "status" "HaHTransferStatus" NOT NULL DEFAULT 'REQUESTED',
  ADD COLUMN "latestClinicalStatus" TEXT,
  ADD COLUMN "medicationSummary" TEXT,
  ADD COLUMN "risksPrecautions" TEXT,
  ADD COLUMN "familyNotified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "receivingContact" TEXT,
  ADD COLUMN "acceptingClinician" TEXT,
  ADD COLUMN "transportReference" TEXT,
  ADD COLUMN "receivedBy" TEXT,
  ADD COLUMN "arrivalHandoverNote" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "updatedById" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE INDEX "HaHTransfer_status_urgency_requestedAt_idx"
  ON "HaHTransfer"("status", "urgency", "requestedAt");