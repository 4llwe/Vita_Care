CREATE TYPE "ClinicalTaskStatus" AS ENUM (
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'OMITTED',
  'CANCELLED'
);

CREATE TYPE "ClinicalTaskPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

CREATE TYPE "ClinicalTaskCategory" AS ENUM (
  'ASSESSMENT',
  'VITALS',
  'MEDICATION',
  'WOUND_CARE',
  'EDUCATION',
  'FOLLOW_UP',
  'OTHER'
);

CREATE TABLE "HaHClinicalTask" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "assignedToHealthWorkerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" "ClinicalTaskCategory" NOT NULL,
  "priority" "ClinicalTaskPriority" NOT NULL DEFAULT 'ROUTINE',
  "status" "ClinicalTaskStatus" NOT NULL DEFAULT 'PLANNED',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "outcomeNote" TEXT,
  "handoverNote" TEXT,
  "createdById" TEXT NOT NULL,
  "completedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HaHClinicalTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHClinicalTask_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HaHClinicalTask_assignedToHealthWorkerId_fkey"
    FOREIGN KEY ("assignedToHealthWorkerId") REFERENCES "HealthWorker"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "HaHClinicalTask_assignedToHealthWorkerId_status_dueAt_idx"
  ON "HaHClinicalTask"("assignedToHealthWorkerId", "status", "dueAt");

CREATE INDEX "HaHClinicalTask_episodeId_status_dueAt_idx"
  ON "HaHClinicalTask"("episodeId", "status", "dueAt");