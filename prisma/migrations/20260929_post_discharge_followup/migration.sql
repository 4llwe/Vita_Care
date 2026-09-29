CREATE TYPE "PostDischargeOutcome" AS ENUM (
  'REACHED', 'NOT_REACHED', 'RESCHEDULED'
);
CREATE TYPE "PostDischargeClinicalStatus" AS ENUM (
  'STABLE', 'CONCERNING', 'EMERGENCY'
);

CREATE TABLE "HaHPostDischargeFollowUp" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "outcome" "PostDischargeOutcome" NOT NULL,
  "respondent" TEXT,
  "symptomUpdate" TEXT,
  "medicationAvailable" BOOLEAN,
  "medicationQuestions" TEXT,
  "followUpAttended" BOOLEAN,
  "newCareNeeds" TEXT,
  "clinicalStatus" "PostDischargeClinicalStatus" NOT NULL,
  "escalationRequired" BOOLEAN NOT NULL DEFAULT false,
  "escalationPlan" TEXT,
  "advice" TEXT,
  "nextContactAt" TIMESTAMP(3),
  "contactedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHPostDischargeFollowUp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHPostDischargeFollowUp_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHPostDischargeFollowUp_episodeId_contactedAt_idx"
  ON "HaHPostDischargeFollowUp"("episodeId", "contactedAt");
CREATE INDEX "HaHPostDischargeFollowUp_clinicalStatus_escalationRequired_nextContactAt_idx"
  ON "HaHPostDischargeFollowUp"("clinicalStatus", "escalationRequired", "nextContactAt");