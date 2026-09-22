import { computeHaHClinicalScore } from "./clinical-score";

const stable = {
  systolic: 120,
  heartRate: 75,
  respRate: 16,
  temperature: 36.8,
  spo2: 98,
  supplementalOxygen: false,
  spo2Scale: 1 as const,
  consciousness: "A" as const,
  newConfusion: false,
};

describe("HaH clinical early-warning score", () => {
  it("stable complete observations are low risk", () => {
    expect(computeHaHClinicalScore(stable)).toMatchObject({
      score: 0,
      risk: "low",
      responseMinutes: null,
    });
  });
  it("critical deterioration creates a 15-minute response target", () => {
    const r = computeHaHClinicalScore({
      ...stable,
      systolic: 85,
      respRate: 26,
      spo2: 89,
      consciousness: "V",
    });
    expect(r.risk).toBe("critical");
    expect(r.responseMinutes).toBe(15);
    expect(r.score).toBeGreaterThanOrEqual(7);
  });
  it("supplemental oxygen contributes to risk", () => {
    expect(
      computeHaHClinicalScore({ ...stable, supplementalOxygen: true }).score,
    ).toBe(2);
  });
});
