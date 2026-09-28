CREATE TYPE "HaHEvaluationDisposition" AS ENUM (
  'CONTINUE_CARE',
  'MODIFY_CARE_PLAN',
  'DISCHARGE_READY',
  'TRANSFER_RECOMMENDED'
);

CREATE TABLE "HaHClinicalEvaluation" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "clinicalSummary" TEXT NOT NULL,
  "progressNotes" TEXT NOT NULL,
  "goalsMet" JSONB NOT NULL,
  "unmetGoals" JSONB,
  "disposition" "HaHEvaluationDisposition" NOT NULL,
  "followUpRequired" TEXT,
  "evaluatedById" TEXT NOT NULL,
  "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHClinicalEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHClinicalEvaluation_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHClinicalEvaluation_episodeId_evaluatedAt_idx"
  ON "HaHClinicalEvaluation"("episodeId", "evaluatedAt");

CREATE INDEX "HaHClinicalEvaluation_disposition_evaluatedAt_idx"
  ON "HaHClinicalEvaluation"("disposition", "evaluatedAt");