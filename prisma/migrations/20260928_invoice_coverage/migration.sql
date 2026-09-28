-- Phase 1.8: additive payer and claim tracking for insurance/BPJS workflows.
CREATE TYPE "PayerType" AS ENUM ('SELF_PAY', 'PRIVATE_INSURANCE', 'BPJS_JKN', 'CORPORATE');
CREATE TYPE "ClaimStatus" AS ENUM ('NOT_APPLICABLE', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID');

ALTER TABLE "Invoice"
  ADD COLUMN "payerType" "PayerType" NOT NULL DEFAULT 'SELF_PAY',
  ADD COLUMN "insurerName" TEXT,
  ADD COLUMN "memberNumber" TEXT,
  ADD COLUMN "claimNumber" TEXT,
  ADD COLUMN "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN "coveredAmount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_coveredAmount_check"
  CHECK ("coveredAmount" >= 0 AND "coveredAmount" <= "total");
CREATE INDEX "Invoice_payerType_claimStatus_issuedAt_idx" ON "Invoice"("payerType", "claimStatus", "issuedAt");
CREATE INDEX "Invoice_claimNumber_idx" ON "Invoice"("claimNumber");
