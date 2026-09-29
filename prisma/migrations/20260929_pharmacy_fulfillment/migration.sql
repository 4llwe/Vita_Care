CREATE TYPE "PharmacyFulfillmentStatus" AS ENUM (
  'REQUESTED', 'CLINICAL_REVIEW', 'APPROVED', 'PREPARING',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
);

CREATE TABLE "MedicationFulfillment" (
  "id" TEXT NOT NULL,
  "medicationOrderId" TEXT NOT NULL,
  "quantity" TEXT NOT NULL,
  "refillNumber" INTEGER NOT NULL DEFAULT 1,
  "deliveryAddress" TEXT NOT NULL,
  "status" "PharmacyFulfillmentStatus" NOT NULL DEFAULT 'REQUESTED',
  "requestNote" TEXT,
  "requestedById" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "preparedById" TEXT,
  "preparedAt" TIMESTAMP(3),
  "courierName" TEXT,
  "trackingNote" TEXT,
  "dispatchedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MedicationFulfillment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MedicationFulfillment_medicationOrderId_fkey"
    FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MedicationFulfillment_medicationOrderId_status_idx"
  ON "MedicationFulfillment"("medicationOrderId", "status");
CREATE INDEX "MedicationFulfillment_status_requestedAt_idx"
  ON "MedicationFulfillment"("status", "requestedAt");