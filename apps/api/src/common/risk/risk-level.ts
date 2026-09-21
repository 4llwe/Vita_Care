import { RiskLevel } from '@prisma/client';

/** Matriks Probability x Impact (1..5) -> RiskLevel. Dipakai modul Findings & Risk. */
export function computeRiskLevel(probability: number, impact: number): RiskLevel {
  const score = probability * impact;
  if (score <= 4) return RiskLevel.LOW;
  if (score <= 9) return RiskLevel.MEDIUM;
  if (score <= 15) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}
