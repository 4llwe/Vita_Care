export type HaHVitals = {
  systolic: number;
  heartRate: number;
  respRate: number;
  temperature: number;
  spo2: number;
  supplementalOxygen: boolean;
  spo2Scale: 1 | 2;
  consciousness: "A" | "V" | "P" | "U";
  newConfusion: boolean;
};
export type ClinicalProtocolConfig = {
  resp: [number, number, number, number];
  temperature: [number, number, number, number];
  systolic: [number, number, number, number];
  heartRate: [number, number, number, number, number];
  spo2Scale1: [number, number, number];
  risk: { medium: number; high: number; critical: number };
  responseMinutes: { medium: number; high: number; critical: number };
};
export const DEFAULT_CLINICAL_PROTOCOL: ClinicalProtocolConfig = {
  resp: [8, 11, 20, 24],
  temperature: [35, 36, 38, 39],
  systolic: [90, 100, 110, 219],
  heartRate: [40, 50, 90, 110, 130],
  spo2Scale1: [91, 93, 95],
  risk: { medium: 3, high: 5, critical: 7 },
  responseMinutes: { medium: 60, high: 30, critical: 15 },
};
export type ClinicalScore = {
  score: number;
  risk: "low" | "medium" | "high" | "critical";
  singleParameterThree: boolean;
  responseMinutes: number | null;
  triggers: string[];
};
const scoreResp = (v: number, b: ClinicalProtocolConfig["resp"]) =>
  v <= b[0] ? 3 : v <= b[1] ? 1 : v <= b[2] ? 0 : v <= b[3] ? 2 : 3;
const scoreTemp = (v: number, b: ClinicalProtocolConfig["temperature"]) =>
  v <= b[0] ? 3 : v <= b[1] ? 1 : v <= b[2] ? 0 : v <= b[3] ? 1 : 2;
const scoreSbp = (v: number, b: ClinicalProtocolConfig["systolic"]) =>
  v <= b[0] ? 3 : v <= b[1] ? 2 : v <= b[2] ? 1 : v <= b[3] ? 0 : 3;
const scoreHr = (v: number, b: ClinicalProtocolConfig["heartRate"]) =>
  v <= b[0] ? 3 : v <= b[1] ? 1 : v <= b[2] ? 0 : v <= b[3] ? 1 : v <= b[4] ? 2 : 3;
const scoreSpo1 = (v: number, b: ClinicalProtocolConfig["spo2Scale1"]) =>
  v <= b[0] ? 3 : v <= b[1] ? 2 : v <= b[2] ? 1 : 0;
function scoreSpo2(v: number, oxygen: boolean) {
  if (v <= 83) return 3;
  if (v <= 85) return 2;
  if (v <= 87) return 1;
  if (v <= 92 || !oxygen) return 0;
  if (v <= 94) return 1;
  if (v <= 96) return 2;
  return 3;
}
export function computeHaHClinicalScore(
  v: HaHVitals,
  p: ClinicalProtocolConfig = DEFAULT_CLINICAL_PROTOCOL,
): ClinicalScore {
  const c = [
    { label: "Frekuensi napas", score: scoreResp(v.respRate, p.resp) },
    {
      label: "SpO2",
      score:
        v.spo2Scale === 2
          ? scoreSpo2(v.spo2, v.supplementalOxygen)
          : scoreSpo1(v.spo2, p.spo2Scale1),
    },
    { label: "Oksigen tambahan", score: v.supplementalOxygen ? 2 : 0 },
    { label: "Suhu", score: scoreTemp(v.temperature, p.temperature) },
    { label: "Tekanan sistolik", score: scoreSbp(v.systolic, p.systolic) },
    { label: "Nadi", score: scoreHr(v.heartRate, p.heartRate) },
    { label: "Kesadaran", score: v.newConfusion || v.consciousness !== "A" ? 3 : 0 },
  ];
  const score = c.reduce((s, x) => s + x.score, 0),
    singleParameterThree = c.some((x) => x.score === 3),
    triggers = c.filter((x) => x.score >= 2).map((x) => `${x.label}=${x.score}`);
  if (score >= p.risk.critical)
    return {
      score,
      risk: "critical",
      singleParameterThree,
      responseMinutes: p.responseMinutes.critical,
      triggers,
    };
  if (score >= p.risk.high)
    return {
      score,
      risk: "high",
      singleParameterThree,
      responseMinutes: p.responseMinutes.high,
      triggers,
    };
  if (singleParameterThree || score >= p.risk.medium)
    return {
      score,
      risk: "medium",
      singleParameterThree,
      responseMinutes: p.responseMinutes.medium,
      triggers,
    };
  return { score, risk: "low", singleParameterThree, responseMinutes: null, triggers };
}
