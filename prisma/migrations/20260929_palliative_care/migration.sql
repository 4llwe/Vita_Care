CREATE TABLE "HaHPalliativeAssessment" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "ppsScore" INTEGER NOT NULL,
  "painScore" INTEGER NOT NULL,
  "dyspneaScore" INTEGER NOT NULL,
  "nauseaScore" INTEGER NOT NULL,
  "anxietyScore" INTEGER NOT NULL,
  "consciousnessNotes" TEXT NOT NULL,
  "otherSymptoms" TEXT,
  "goalsOfCare" TEXT NOT NULL,
  "preferredPlaceOfCare" TEXT NOT NULL,
  "escalationPreferences" TEXT NOT NULL,
  "comfortPlan" TEXT NOT NULL,
  "familyDiscussionSummary" TEXT,
  "spiritualPsychosocialNeed" TEXT,
  "nextReviewAt" TIMESTAMP(3) NOT NULL,
  "assessedById" TEXT NOT NULL,
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHPalliativeAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHPalliativeAssessment_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHPalliativeAssessment_episodeId_assessedAt_idx"
  ON "HaHPalliativeAssessment"("episodeId", "assessedAt");
CREATE INDEX "HaHPalliativeAssessment_painScore_dyspneaScore_nextReviewAt_idx"
  ON "HaHPalliativeAssessment"("painScore", "dyspneaScore", "nextReviewAt");