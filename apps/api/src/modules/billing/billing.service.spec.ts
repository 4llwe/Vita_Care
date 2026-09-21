import { BillingService } from './billing.service';

describe('BillingService', () => {
  describe('computeTotals', () => {
    it('menghitung subtotal tanpa pajak', () => {
      const r = BillingService.computeTotals([
        { qty: 1, unitPrice: 250_000 },
        { qty: 2, unitPrice: 180_000 },
      ]);
      expect(r.subtotal).toBe(610_000);
      expect(r.tax).toBe(0);
      expect(r.total).toBe(610_000);
    });

    it('menghitung pajak 11%', () => {
      const r = BillingService.computeTotals([{ qty: 1, unitPrice: 100_000 }], 11);
      expect(r.tax).toBe(11_000);
      expect(r.total).toBe(111_000);
    });
  });

  describe('generateCode', () => {
    it('membuat kode invoice berformat INV-YYYY-0001', async () => {
      const prisma: any = { invoice: { count: jest.fn().mockResolvedValue(0) } };
      const svc = new BillingService(prisma, {} as any, {} as any);
      const code = await svc.generateCode(new Date('2026-03-01T00:00:00Z'));
      expect(code).toBe('INV-2026-0001');
    });
  });
});
