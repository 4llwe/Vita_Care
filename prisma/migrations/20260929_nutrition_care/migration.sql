CREATE TYPE "NutritionRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

CREATE TABLE "HaHNutritionAssessment" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "heightCm" DOUBLE PRECISION NOT NULL,
  "bmi" DOUBLE PRECISION NOT NULL,
  "weightChangePercent" DOUBLE PRECISION,
  "intakePercent" INTEGER NOT NULL,
  "appetite" TEXT NOT NULL,
  "swallowingDifficulty" BOOLEAN NOT NULL DEFAULT false,
  "nauseaVomiting" BOOLEAN NOT NULL DEFAULT false,
  "nutritionRisk" "NutritionRiskLevel" NOT NULL,
  "dietPlan" TEXT NOT NULL,
  "proteinTargetG" DOUBLE PRECISION,
  "fluidTargetMl" INTEGER,
  "supplements" TEXT,
  "education" TEXT,
  "nextReviewAt" TIMESTAMP(3) NOT NULL,
  "assessedById" TEXT NOT NULL,
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHNutritionAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHNutritionAssessment_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHNutritionAssessment_episodeId_assessedAt_idx"
  ON "HaHNutritionAssessment"("episodeId", "assessedAt");
CREATE INDEX "HaHNutritionAssessment_nutritionRisk_nextReviewAt_idx"
  ON "HaHNutritionAssessment"("nutritionRisk", "nextReviewAt");