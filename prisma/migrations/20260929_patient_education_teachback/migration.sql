CREATE TYPE "EducationAudience" AS ENUM ('PATIENT', 'CAREGIVER', 'BOTH');
CREATE TYPE "EducationComprehension" AS ENUM (
  'UNDERSTOOD', 'PARTIAL', 'NEEDS_REINFORCEMENT'
);

CREATE TABLE "HaHEducationRecord" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "audience" "EducationAudience" NOT NULL,
  "contentSummary" TEXT NOT NULL,
  "deliveryMethod" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "teachBackResponse" TEXT NOT NULL,
  "comprehension" "EducationComprehension" NOT NULL,
  "barriers" TEXT,
  "reinforcementPlan" TEXT,
  "educationalMaterial" TEXT,
  "nextReviewAt" TIMESTAMP(3),
  "educatedById" TEXT NOT NULL,
  "educatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHEducationRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHEducationRecord_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHEducationRecord_episodeId_educatedAt_idx"
  ON "HaHEducationRecord"("episodeId", "educatedAt");
CREATE INDEX "HaHEducationRecord_comprehension_nextReviewAt_idx"
  ON "HaHEducationRecord"("comprehension", "nextReviewAt");