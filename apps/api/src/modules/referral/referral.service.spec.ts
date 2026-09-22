import { canTransition } from './referral.service';
import { ReferralStatus } from '@prisma/client';

describe('ReferralService / canTransition', () => {
  it('mengizinkan REQUESTED → ACCEPTED → COMPLETED', () => {
    expect(canTransition(ReferralStatus.REQUESTED, ReferralStatus.ACCEPTED)).toBe(true);
    expect(canTransition(ReferralStatus.ACCEPTED, ReferralStatus.COMPLETED)).toBe(true);
  });

  it('menolak REQUESTED → COMPLETED langsung', () => {
    expect(canTransition(ReferralStatus.REQUESTED, ReferralStatus.COMPLETED)).toBe(false);
  });

  it('status REJECTED & COMPLETED bersifat final', () => {
    expect(canTransition(ReferralStatus.REJECTED, ReferralStatus.ACCEPTED)).toBe(false);
    expect(canTransition(ReferralStatus.COMPLETED, ReferralStatus.ACCEPTED)).toBe(false);
  });
});
