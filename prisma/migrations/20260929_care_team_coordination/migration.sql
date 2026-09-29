ALTER TABLE "CareAssignment"
  ADD COLUMN "responsibility" TEXT,
  ADD COLUMN "assignedById" TEXT,
  ADD COLUMN "endedById" TEXT,
  ADD COLUMN "endReason" TEXT;

CREATE INDEX "CareAssignment_episodeId_isActive_idx"
  ON "CareAssignment"("episodeId", "isActive");