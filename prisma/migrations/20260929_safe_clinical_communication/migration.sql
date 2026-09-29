ALTER TABLE "HaHClinicalMessage"
  ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'ALL',
  ADD COLUMN "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "acknowledgementDueAt" TIMESTAMP(3);

CREATE INDEX "HaHClinicalMessage_requiresAcknowledgement_acknowledgementDueAt_idx"
  ON "HaHClinicalMessage"("requiresAcknowledgement", "acknowledgementDueAt");

CREATE TABLE "HaHClinicalMessageReceipt" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgementNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HaHClinicalMessageReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHClinicalMessageReceipt_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "HaHClinicalMessage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HaHClinicalMessageReceipt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "HaHClinicalMessageReceipt_messageId_userId_key"
  ON "HaHClinicalMessageReceipt"("messageId", "userId");
CREATE INDEX "HaHClinicalMessageReceipt_userId_readAt_acknowledgedAt_idx"
  ON "HaHClinicalMessageReceipt"("userId", "readAt", "acknowledgedAt");