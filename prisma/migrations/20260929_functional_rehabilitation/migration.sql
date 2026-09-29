CREATE TYPE "FallRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');
CREATE TYPE "FunctionalProgress" AS ENUM (
  'IMPROVING', 'STABLE', 'DECLINING', 'GOAL_ACHIEVED'
);

CREATE TABLE "HaHFunctionalAssessment" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "mobilityLevel" TEXT NOT NULL,
  "adlScore" INTEGER NOT NULL,
  "fallRisk" "FallRiskLevel" NOT NULL,
  "fallsLast30Days" INTEGER NOT NULL DEFAULT 0,
  "gaitAid" TEXT,
  "transferAbility" TEXT NOT NULL,
  "enduranceNotes" TEXT,
  "homeHazards" TEXT,
  "rehabilitationGoals" TEXT NOT NULL,
  "exercisePlan" TEXT NOT NULL,
  "caregiverTraining" TEXT,
  "progress" "FunctionalProgress" NOT NULL,
  "nextReviewAt" TIMESTAMP(3) NOT NULL,
  "assessedById" TEXT NOT NULL,
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHFunctionalAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHFunctionalAssessment_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHFunctionalAssessment_episodeId_assessedAt_idx"
  ON "HaHFunctionalAssessment"("episodeId", "assessedAt");
CREATE INDEX "HaHFunctionalAssessment_fallRisk_progress_nextReviewAt_idx"
  ON "HaHFunctionalAssessment"("fallRisk", "progress", "nextReviewAt");