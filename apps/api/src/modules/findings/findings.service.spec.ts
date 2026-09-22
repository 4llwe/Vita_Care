import { FindingsService } from './findings.service';
import { RiskLevel, FindingCategory } from '@prisma/client';

describe('FindingsService', () => {
  describe('calcRisk (matriks P x I)', () => {
    it('LOW untuk skor <= 4', () => {
      expect(FindingsService.calcRisk(1, 1)).toBe(RiskLevel.LOW);
      expect(FindingsService.calcRisk(2, 2)).toBe(RiskLevel.LOW);
    });
    it('MEDIUM untuk skor 5..9', () => {
      expect(FindingsService.calcRisk(3, 3)).toBe(RiskLevel.MEDIUM);
    });
    it('HIGH untuk skor 10..15', () => {
      expect(FindingsService.calcRisk(3, 4)).toBe(RiskLevel.HIGH);
    });
    it('CRITICAL untuk skor > 15', () => {
      expect(FindingsService.calcRisk(4, 5)).toBe(RiskLevel.CRITICAL);
      expect(FindingsService.calcRisk(5, 5)).toBe(RiskLevel.CRITICAL);
    });
  });

  describe('create', () => {
    it('membuat finding dengan kode & riskLevel terhitung', async () => {
      const prisma: any = {
        finding: {
          count: jest.fn().mockResolvedValue(30),
          create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'x', ...data })),
        },
      };
      const svc = new FindingsService(prisma);
      const res = await svc.create({
        description: 'Insiden keselamatan pemasangan infus',
        category: FindingCategory.CRITICAL,
        probability: 4,
        impact: 5,
      } as any);
      expect(res.code).toMatch(/^TM-\d{4}-031$/);
      expect(res.riskLevel).toBe(RiskLevel.CRITICAL);
      expect(prisma.finding.create).toHaveBeenCalledTimes(1);
    });
  });
});
