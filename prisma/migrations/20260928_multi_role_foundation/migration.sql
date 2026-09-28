ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DOCTOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'NURSE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE';
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");
CREATE INDEX "UserRole_role_userId_idx" ON "UserRole"("role", "userId");
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "UserRole" ("id", "userId", "role")
SELECT CONCAT('role_', md5("id" || ':' || "role"::text)), "id", "role"
FROM "User" ON CONFLICT ("userId", "role") DO NOTHING;