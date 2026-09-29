CREATE TYPE "HaHIncidentSeverity" AS ENUM (
  'NO_HARM',
  'LOW',
  'MODERATE',
  'SEVERE',
  'SENTINEL'
);

CREATE TYPE "HaHIncidentStatus" AS ENUM (
  'REPORTED',
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'RESOLVED'
);

CREATE TABLE "HaHSafetyIncident" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "severity" "HaHIncidentSeverity" NOT NULL,
  "status" "HaHIncidentStatus" NOT NULL DEFAULT 'REPORTED',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "immediateAction" TEXT NOT NULL,
  "patientCondition" TEXT NOT NULL,
  "witnesses" TEXT,
  "reportedById" TEXT NOT NULL,
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewSummary" TEXT,
  "rootCause" TEXT,
  "correctiveAction" TEXT,
  "patientFamilyInformed" BOOLEAN NOT NULL DEFAULT false,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "HaHSafetyIncident_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHSafetyIncident_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHSafetyIncident_episodeId_occurredAt_idx"
  ON "HaHSafetyIncident"("episodeId", "occurredAt");
CREATE INDEX "HaHSafetyIncident_status_severity_reportedAt_idx"
  ON "HaHSafetyIncident"("status", "severity", "reportedAt");