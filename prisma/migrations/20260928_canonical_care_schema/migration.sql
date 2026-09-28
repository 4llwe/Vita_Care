CREATE TYPE "CareAssignmentType" AS ENUM (
  'PRIMARY_CLINICIAN',
  'VISIT',
  'CARE_COORDINATOR'
);

CREATE TABLE "Patient" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "mrn" TEXT NOT NULL,
  "nationalId" TEXT,
  "fullName" TEXT NOT NULL,
  "phone" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "sexAtBirth" TEXT,
  "address" TEXT,
  "zone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT,
  "patientId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'DIPESAN',
  "zone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareAssignment" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT,
  "episodeId" TEXT,
  "healthWorkerId" TEXT NOT NULL,
  "type" "CareAssignmentType" NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareAssignment_exactly_one_target_check"
    CHECK (("appointmentId" IS NOT NULL) <> ("episodeId" IS NOT NULL))
);

CREATE UNIQUE INDEX "Patient_userId_key" ON "Patient"("userId");
CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");
CREATE UNIQUE INDEX "Patient_nationalId_key" ON "Patient"("nationalId");
CREATE INDEX "Patient_fullName_idx" ON "Patient"("fullName");
CREATE UNIQUE INDEX "Appointment_bookingId_key" ON "Appointment"("bookingId");
CREATE INDEX "Appointment_patientId_scheduledAt_idx" ON "Appointment"("patientId", "scheduledAt");
CREATE INDEX "Appointment_serviceId_scheduledAt_idx" ON "Appointment"("serviceId", "scheduledAt");
CREATE UNIQUE INDEX "CareAssignment_appointmentId_healthWorkerId_type_key"
  ON "CareAssignment"("appointmentId", "healthWorkerId", "type");
CREATE UNIQUE INDEX "CareAssignment_episodeId_healthWorkerId_type_key"
  ON "CareAssignment"("episodeId", "healthWorkerId", "type");
CREATE INDEX "CareAssignment_healthWorkerId_isActive_startsAt_idx"
  ON "CareAssignment"("healthWorkerId", "isActive", "startsAt");

ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_episodeId_fkey"
  FOREIGN KEY ("episodeId") REFERENCES "HaHEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareAssignment" ADD CONSTRAINT "CareAssignment_healthWorkerId_fkey"
  FOREIGN KEY ("healthWorkerId") REFERENCES "HealthWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HaHPatient" ADD COLUMN "canonicalPatientId" TEXT;
CREATE UNIQUE INDEX "HaHPatient_canonicalPatientId_key" ON "HaHPatient"("canonicalPatientId");
ALTER TABLE "HaHPatient" ADD CONSTRAINT "HaHPatient_canonicalPatientId_fkey"
  FOREIGN KEY ("canonicalPatientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Patient" (
  "id", "userId", "mrn", "nationalId", "fullName", "phone",
  "dateOfBirth", "sexAtBirth", "address", "zone", "createdAt", "updatedAt"
)
SELECT
  CONCAT('patient_hah_', md5(h."id")),
  h."portalUserId",
  h."mrn",
  h."nationalId",
  h."fullName",
  h."phone",
  h."dateOfBirth",
  h."sexAtBirth",
  h."address",
  h."zone",
  h."createdAt",
  h."updatedAt"
FROM "HaHPatient" h
ON CONFLICT DO NOTHING;

INSERT INTO "Patient" (
  "id", "userId", "mrn", "fullName", "phone", "createdAt", "updatedAt"
)
SELECT
  CONCAT('patient_user_', md5(b."patientUserId")),
  b."patientUserId",
  CONCAT('USR-', UPPER(SUBSTRING(md5(b."patientUserId"), 1, 12))),
  MIN(b."patientName"),
  MIN(b."patientPhone"),
  MIN(b."createdAt"),
  CURRENT_TIMESTAMP
FROM "Booking" b
WHERE b."patientUserId" IS NOT NULL
GROUP BY b."patientUserId"
ON CONFLICT DO NOTHING;

INSERT INTO "Patient" (
  "id", "mrn", "fullName", "phone", "zone", "createdAt", "updatedAt"
)
SELECT
  CONCAT('patient_booking_', md5(b."id")),
  CONCAT('ANON-', b."code"),
  b."patientName",
  b."patientPhone",
  b."zone",
  b."createdAt",
  CURRENT_TIMESTAMP
FROM "Booking" b
WHERE b."patientUserId" IS NULL
ON CONFLICT DO NOTHING;

UPDATE "HaHPatient" h
SET "canonicalPatientId" = p."id"
FROM "Patient" p
WHERE p."mrn" = h."mrn";

INSERT INTO "Appointment" (
  "id", "bookingId", "patientId", "serviceId", "scheduledAt",
  "status", "zone", "createdAt", "updatedAt"
)
SELECT
  CONCAT('appointment_', md5(b."id")),
  b."id",
  COALESCE(
    (SELECT p."id" FROM "Patient" p WHERE p."userId" = b."patientUserId"),
    CONCAT('patient_booking_', md5(b."id"))
  ),
  b."serviceId",
  b."scheduledAt",
  b."status",
  b."zone",
  b."createdAt",
  CURRENT_TIMESTAMP
FROM "Booking" b
ON CONFLICT DO NOTHING;

INSERT INTO "CareAssignment" (
  "id", "appointmentId", "healthWorkerId", "type", "startsAt", "createdAt"
)
SELECT
  CONCAT('assignment_booking_', md5(b."id" || ':' || b."healthWorkerId")),
  a."id",
  b."healthWorkerId",
  'VISIT',
  b."scheduledAt",
  b."createdAt"
FROM "Booking" b
JOIN "Appointment" a ON a."bookingId" = b."id"
WHERE b."healthWorkerId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "CareAssignment" (
  "id", "episodeId", "healthWorkerId", "type", "startsAt", "createdAt"
)
SELECT
  CONCAT('assignment_episode_', md5(e."id" || ':' || hw."id")),
  e."id",
  hw."id",
  'PRIMARY_CLINICIAN',
  e."createdAt",
  e."createdAt"
FROM "HaHEpisode" e
JOIN "HealthWorker" hw ON hw."userId" = e."attendingPhysicianId"
ON CONFLICT DO NOTHING;

INSERT INTO "CareAssignment" (
  "id", "episodeId", "healthWorkerId", "type", "startsAt", "createdAt"
)
SELECT
  CONCAT('assignment_visit_', md5(v."episodeId" || ':' || v."healthWorkerId")),
  v."episodeId",
  v."healthWorkerId",
  'VISIT',
  MIN(v."scheduledStart"),
  MIN(v."createdAt")
FROM "HaHVisit" v
GROUP BY v."episodeId", v."healthWorkerId"
ON CONFLICT DO NOTHING;