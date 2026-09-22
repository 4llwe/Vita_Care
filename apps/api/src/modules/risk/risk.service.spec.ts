import { RiskService } from './risk.service';
import { computeRiskLevel } from '../../common/risk/risk-level';
import { RiskLevel } from '@prisma/client';

describe('RiskService / computeRiskLevel', () => {
  it('memetakan skor ke level dengan benar', () => {
    expect(computeRiskLevel(1, 1)).toBe(RiskLevel.LOW);
    expect(computeRiskLevel(3, 3)).toBe(RiskLevel.MEDIUM);
    expect(computeRiskLevel(3, 4)).toBe(RiskLevel.HIGH);
    expect(computeRiskLevel(5, 5)).toBe(RiskLevel.CRITICAL);
  });

  it('membangun heatmap 5x5 = 25 sel', async () => {
    const prisma: any = {
      riskRegister: {
        findMany: jest.fn().mockResolvedValue([
          { probability: 5, impact: 5 },
          { probability: 5, impact: 5 },
          { probability: 1, impact: 1 },
        ]),
      },
    };
    const svc = new RiskService(prisma);
    const cells = await svc.heatmap();
    expect(cells).toHaveLength(25);
    expect(cells.find((c) => c.probability === 5 && c.impact === 5)?.count).toBe(2);
    expect(cells.find((c) => c.probability === 1 && c.impact === 1)?.count).toBe(1);
  });
});
