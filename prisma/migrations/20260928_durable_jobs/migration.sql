-- Phase 1.5: database lease state for Redis-backed notification jobs.
ALTER TABLE "NotificationDelivery" ADD COLUMN "lockedAt" TIMESTAMP(3);
CREATE INDEX "NotificationDelivery_status_lockedAt_idx" ON "NotificationDelivery"("status", "lockedAt");
