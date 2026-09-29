CREATE TABLE "HaHDischargeChecklist" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "medicationReconciled" BOOLEAN NOT NULL DEFAULT false,
  "medicationSummary" TEXT NOT NULL,
  "pendingResultsReviewed" BOOLEAN NOT NULL DEFAULT false,
  "pendingResultsPlan" TEXT NOT NULL,
  "equipmentReturnPlanned" BOOLEAN NOT NULL DEFAULT false,
  "equipmentReturnPlan" TEXT NOT NULL,
  "followUpBooked" BOOLEAN NOT NULL DEFAULT false,
  "followUpAt" TIMESTAMP(3) NOT NULL,
  "followUpProvider" TEXT NOT NULL,
  "redFlagsReviewed" BOOLEAN NOT NULL DEFAULT false,
  "caregiverTeachBackPassed" BOOLEAN NOT NULL DEFAULT false,
  "documentsDelivered" BOOLEAN NOT NULL DEFAULT false,
  "contactInstructions" TEXT NOT NULL,
  "completedById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHDischargeChecklist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHDischargeChecklist_episodeId_key" UNIQUE ("episodeId"),
  CONSTRAINT "HaHDischargeChecklist_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);