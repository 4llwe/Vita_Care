import { BadRequestException } from "@nestjs/common";
import type { ClinicalProtocolConfig } from "./clinical-score";
function band(v: unknown, n: number, name: string): number[] {
  if (
    !Array.isArray(v) ||
    v.length !== n ||
    v.some((x) => typeof x !== "number" || !Number.isFinite(x))
  )
    throw new BadRequestException(`${name} harus berisi ${n} angka`);
  for (let i = 1; i < v.length; i++)
    if (v[i] <= v[i - 1]) throw new BadRequestException(`${name} harus berurutan naik`);
  return v;
}
export function validateClinicalProtocol(
  t: Record<string, unknown>,
  s: Record<string, unknown>,
): ClinicalProtocolConfig {
  const r = (t.risk ?? {}) as Record<string, unknown>;
  for (const k of ["medium", "high", "critical"])
    if (typeof r[k] !== "number" || typeof s[k] !== "number")
      throw new BadRequestException(`risk dan SLA ${k} wajib angka`);
  if (!(Number(r.medium) < Number(r.high) && Number(r.high) < Number(r.critical)))
    throw new BadRequestException("Ambang risiko harus medium < high < critical");
  if (
    !(Number(s.critical) <= Number(s.high) && Number(s.high) <= Number(s.medium)) ||
    Number(s.critical) < 1
  )
    throw new BadRequestException("SLA harus positif dan critical ≤ high ≤ medium");
  return {
    resp: band(t.resp, 4, "resp") as any,
    temperature: band(t.temperature, 4, "temperature") as any,
    systolic: band(t.systolic, 4, "systolic") as any,
    heartRate: band(t.heartRate, 5, "heartRate") as any,
    spo2Scale1: band(t.spo2Scale1, 3, "spo2Scale1") as any,
    risk: {
      medium: Number(r.medium),
      high: Number(r.high),
      critical: Number(r.critical),
    },
    responseMinutes: {
      medium: Number(s.medium),
      high: Number(s.high),
      critical: Number(s.critical),
    },
  };
}
