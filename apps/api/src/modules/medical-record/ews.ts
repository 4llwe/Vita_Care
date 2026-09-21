/**
 * Perhitungan Early Warning Score (EWS) gaya NEWS2 yang disederhanakan.
 * Dipakai untuk deteksi dini perburukan kondisi pasien home care.
 */
export type Vitals = {
  systolic?: number;
  heartRate?: number;
  respRate?: number;
  temperature?: number;
  spo2?: number;
  consciousness?: 'A' | 'V' | 'P' | 'U' | string;
};

export type EwsResult = { score: number; risk: 'low' | 'medium' | 'high' };

function respScore(rr?: number): number {
  if (rr == null) return 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

function spo2Score(s?: number): number {
  if (s == null) return 0;
  if (s <= 91) return 3;
  if (s <= 93) return 2;
  if (s <= 95) return 1;
  return 0;
}

function tempScore(t?: number): number {
  if (t == null) return 0;
  if (t <= 35) return 3;
  if (t <= 36) return 1;
  if (t <= 38) return 0;
  if (t <= 39) return 1;
  return 2;
}

function sbpScore(sbp?: number): number {
  if (sbp == null) return 0;
  if (sbp <= 90) return 3;
  if (sbp <= 100) return 2;
  if (sbp <= 110) return 1;
  if (sbp <= 219) return 0;
  return 3;
}

function hrScore(hr?: number): number {
  if (hr == null) return 0;
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}

function consciousnessScore(c?: string): number {
  return !c || c === 'A' ? 0 : 3;
}

export function computeEws(v: Vitals): EwsResult {
  const score =
    respScore(v.respRate) +
    spo2Score(v.spo2) +
    tempScore(v.temperature) +
    sbpScore(v.systolic) +
    hrScore(v.heartRate) +
    consciousnessScore(v.consciousness);

  // Risiko: high bila total >=7 atau ada satu parameter bernilai 3
  const anyThree =
    respScore(v.respRate) === 3 ||
    spo2Score(v.spo2) === 3 ||
    sbpScore(v.systolic) === 3 ||
    hrScore(v.heartRate) === 3 ||
    consciousnessScore(v.consciousness) === 3;

  let risk: EwsResult['risk'] = 'low';
  if (score >= 7) risk = 'high';
  else if (score >= 5 || anyThree) risk = 'medium';

  return { score, risk };
}
