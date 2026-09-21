import { computeEws } from './ews';

describe('computeEws (EWS)', () => {
  it('pasien stabil -> risiko low', () => {
    const r = computeEws({ systolic: 120, heartRate: 75, respRate: 16, temperature: 36.8, spo2: 98, consciousness: 'A' });
    expect(r.score).toBe(0);
    expect(r.risk).toBe('low');
  });

  it('satu parameter ekstrem (SpO2 90) -> minimal medium', () => {
    const r = computeEws({ systolic: 120, heartRate: 75, respRate: 16, temperature: 36.8, spo2: 90, consciousness: 'A' });
    expect(r.risk === 'medium' || r.risk === 'high').toBe(true);
  });

  it('kondisi berat -> risiko high', () => {
    const r = computeEws({ systolic: 85, heartRate: 135, respRate: 26, temperature: 39.5, spo2: 90, consciousness: 'V' });
    expect(r.score).toBeGreaterThanOrEqual(7);
    expect(r.risk).toBe('high');
  });
});
