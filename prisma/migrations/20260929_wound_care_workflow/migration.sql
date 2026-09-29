CREATE TYPE "WoundProgress" AS ENUM (
  'IMPROVING', 'STABLE', 'DETERIORATING', 'HEALED'
);

CREATE TABLE "HaHWoundAssessment" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "woundLabel" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "woundType" TEXT NOT NULL,
  "lengthCm" DOUBLE PRECISION,
  "widthCm" DOUBLE PRECISION,
  "depthCm" DOUBLE PRECISION,
  "tissueDescription" TEXT NOT NULL,
  "exudate" TEXT NOT NULL,
  "odor" BOOLEAN NOT NULL DEFAULT false,
  "surroundingSkin" TEXT NOT NULL,
  "painScore" INTEGER NOT NULL,
  "infectionSigns" BOOLEAN NOT NULL DEFAULT false,
  "progress" "WoundProgress" NOT NULL,
  "cleansing" TEXT,
  "dressing" TEXT NOT NULL,
  "education" TEXT,
  "nextReviewAt" TIMESTAMP(3) NOT NULL,
  "assessedById" TEXT NOT NULL,
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHWoundAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHWoundAssessment_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHWoundAssessment_episodeId_woundLabel_assessedAt_idx"
  ON "HaHWoundAssessment"("episodeId", "woundLabel", "assessedAt");
CREATE INDEX "HaHWoundAssessment_infectionSigns_progress_nextReviewAt_idx"
  ON "HaHWoundAssessment"("infectionSigns", "progress", "nextReviewAt");