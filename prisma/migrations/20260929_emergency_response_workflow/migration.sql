CREATE TYPE "EmergencyAction" AS ENUM (
  'MEDICAL_TEAM',
  'HOSPITAL',
  'AMBULANCE',
  'LOCATION_SHARED'
);

CREATE TYPE "EmergencyEventStatus" AS ENUM (
  'OPEN',
  'ACKNOWLEDGED',
  'RESOLVED'
);

CREATE TABLE "HaHEmergencyEvent" (
  "id" TEXT NOT NULL,
  "episodeId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" "EmergencyAction" NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "note" TEXT,
  "status" "EmergencyEventStatus" NOT NULL DEFAULT 'OPEN',
  "acknowledgedById" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHEmergencyEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHEmergencyEvent_episodeId_fkey"
    FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHEmergencyEvent_status_createdAt_idx"
  ON "HaHEmergencyEvent"("status", "createdAt");

CREATE INDEX "HaHEmergencyEvent_episodeId_createdAt_idx"
  ON "HaHEmergencyEvent"("episodeId", "createdAt");