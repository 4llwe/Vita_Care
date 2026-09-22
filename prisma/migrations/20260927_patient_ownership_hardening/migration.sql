ALTER TABLE "Booking" ADD COLUMN "patientUserId" TEXT;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Booking_patientUserId_scheduledAt_idx" ON "Booking"("patientUserId", "scheduledAt");
CREATE INDEX "Booking_healthWorkerId_scheduledAt_idx" ON "Booking"("healthWorkerId", "scheduledAt");
