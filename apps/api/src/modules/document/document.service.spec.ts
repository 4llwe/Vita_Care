import { ForbiddenException } from '@nestjs/common';
import { DocumentAccessLevel, DocumentStatus, Role } from '@prisma/client';
import { AuthActor } from '../../common/auth/actor';
import { DocumentService, canTransition } from './document.service';

const actor: AuthActor = { id: 'user-1', role: Role.UNIT_HEAD, roles: [Role.UNIT_HEAD] };

function serviceWith(document: any) {
  const tx = {
    document: {
      findUnique: jest.fn().mockResolvedValue(document),
      findUniqueOrThrow: jest.fn().mockResolvedValue(document),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    },
  };
  const prisma = { withActor: jest.fn((_actor, callback) => callback(tx)) };
  return { service: new DocumentService(prisma as any), tx };
}

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

describe('DocumentService / object authorization', () => {
  it('menolak pembacaan dokumen milik pengguna lain tanpa grant', async () => {
    const { service } = serviceWith({ id: 'doc-1', ownerId: 'user-2', accesses: [] });
    await expect(service.findOne('doc-1', actor)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('mengizinkan pembacaan dengan grant READ', async () => {
    const document = { id: 'doc-1', ownerId: 'user-2', accesses: [{ level: DocumentAccessLevel.READ }] };
    const { service } = serviceWith(document);
    await expect(service.findOne('doc-1', actor)).resolves.toBe(document);
  });

  it('mengabaikan ownerId palsu untuk pembuat non-admin', async () => {
    const { service, tx } = serviceWith(null);
    await service.create({ title: 'SOP', category: 'Clinical', ownerId: 'user-2' }, actor);
    expect(tx.document.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ ownerId: actor.id }),
    }));
  });
});
