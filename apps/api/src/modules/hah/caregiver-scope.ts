export const CAREGIVER_SCOPES = [
  "SUMMARY",
  "VITALS",
  "CARE_PLAN",
  "MEDICATIONS",
  "DIAGNOSTICS",
  "SCHEDULE",
  "MESSAGES",
] as const;

export type CaregiverScope = (typeof CAREGIVER_SCOPES)[number];

export function requiredCaregiverScope(
  path: string,
): CaregiverScope | null {
  if (path.includes("emergency-events")) return null;
  if (path.includes("messages")) return "MESSAGES";
  if (
    path.includes("medication-adherence") ||
    path.includes("medications") ||
    path.includes("pharmacy")
  )
    return "MEDICATIONS";
  if (path.includes("diagnostics")) return "DIAGNOSTICS";
  if (path.includes("visits")) return "SCHEDULE";
  if (path.includes("observations") || path.includes("alerts"))
    return "VITALS";
  if (
    path.includes("care-plan") ||
    path.includes("wounds") ||
    path.includes("functional-assessments") ||
    path.includes("nutrition-assessments") ||
    path.includes("palliative-assessments") ||
    path.includes("education-records") ||
    path.includes("teleconsultations") ||
    path.includes("tasks") ||
    path.includes("clinical-tasks") ||
    path.includes("evaluations") ||
    path.includes("equipment") ||
    path.includes("transfers") ||
    path.includes("discharge-readiness")
    || path.includes("discharge-checklist")
  )
    return "CARE_PLAN";
  return "SUMMARY";
}

export function caregiverScopeList(value: unknown): CaregiverScope[] {
  if (!Array.isArray(value)) return [];
  return value.filter((scope): scope is CaregiverScope =>
    CAREGIVER_SCOPES.includes(scope as CaregiverScope),
  );
}