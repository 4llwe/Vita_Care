import { canTransition } from './document.service';
import { DocumentStatus } from '@prisma/client';

describe('DocumentService / canTransition', () => {
  it('mengizinkan alur normal DRAFT → IN_REVIEW → APPROVED', () => {
    expect(canTransition(DocumentStatus.DRAFT, DocumentStatus.IN_REVIEW)).toBe(true);
    expect(canTransition(DocumentStatus.IN_REVIEW, DocumentStatus.APPROVED)).toBe(true);
  });

  it('menolak lompatan DRAFT → APPROVED', () => {
    expect(canTransition(DocumentStatus.DRAFT, DocumentStatus.APPROVED)).toBe(false);
  });

  it('mengizinkan revisi: APPROVED → DRAFT', () => {
    expect(canTransition(DocumentStatus.APPROVED, DocumentStatus.DRAFT)).toBe(true);
  });

  it('dokumen ARCHIVED bersifat final', () => {
    expect(canTransition(DocumentStatus.ARCHIVED, DocumentStatus.DRAFT)).toBe(false);
  });
});
