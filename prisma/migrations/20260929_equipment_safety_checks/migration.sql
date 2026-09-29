CREATE TABLE "HaHEquipmentSafetyCheck" (
  "id" TEXT NOT NULL,
  "equipmentAssignmentId" TEXT NOT NULL,
  "operational" BOOLEAN NOT NULL,
  "powerSupply" TEXT,
  "batteryPercent" INTEGER,
  "consumableLevel" TEXT,
  "cleanliness" TEXT NOT NULL,
  "alarmTested" BOOLEAN NOT NULL DEFAULT false,
  "issueDescription" TEXT,
  "actionTaken" TEXT,
  "nextCheckAt" TIMESTAMP(3) NOT NULL,
  "checkedById" TEXT NOT NULL,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HaHEquipmentSafetyCheck_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HaHEquipmentSafetyCheck_equipmentAssignmentId_fkey"
    FOREIGN KEY ("equipmentAssignmentId") REFERENCES "HaHEquipmentAssignment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "HaHEquipmentSafetyCheck_equipmentAssignmentId_checkedAt_idx"
  ON "HaHEquipmentSafetyCheck"("equipmentAssignmentId", "checkedAt");
CREATE INDEX "HaHEquipmentSafetyCheck_operational_nextCheckAt_idx"
  ON "HaHEquipmentSafetyCheck"("operational", "nextCheckAt");