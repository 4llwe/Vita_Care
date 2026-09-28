import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentAccessLevel, DocumentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthActor, actorHasAnyRole } from '../../common/auth/actor';
import { CreateDocumentDto, NewVersionDto, ReviewDto, SetDocumentAccessDto } from './dto/create-document.dto';

export const DOC_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ['IN_REVIEW', 'ARCHIVED'], IN_REVIEW: ['APPROVED', 'REJECTED'],
  REJECTED: ['DRAFT', 'ARCHIVED'], APPROVED: ['ARCHIVED', 'DRAFT'], ARCHIVED: [],
};
export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean { return DOC_TRANSITIONS[from]?.includes(to) ?? false; }
type AccessMode = 'READ' | 'EDIT' | 'REVIEW';
const ACCESS_RANK: Record<DocumentAccessLevel, number> = { READ: 1, EDIT: 2, REVIEW: 3 };
const REQUIRED_RANK: Record<AccessMode, number> = { READ: 1, EDIT: 2, REVIEW: 3 };

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}
  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear(); const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.document.count({ where: { createdAt: { gte: start } } });
    return `DOC-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  async create(dto: CreateDocumentDto, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      const year = new Date().getFullYear();
      const count = await tx.document.count({ where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } } });
      const mayChooseOwner = actorHasAnyRole(actor, ['SUPER_ADMIN', 'COORDINATOR']);
      return tx.document.create({ data: {
        code: `DOC-${year}-${String(count + 1).padStart(3, '0')}`, title: dto.title,
        category: dto.category, ownerId: mayChooseOwner && dto.ownerId ? dto.ownerId : actor.id,
        status: DocumentStatus.DRAFT,
      } });
    });
  }
  async addVersion(documentId: string, dto: NewVersionDto, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      const doc = await this.assertAccess(tx, documentId, actor, 'EDIT');
      if (doc.status === DocumentStatus.ARCHIVED) throw new BadRequestException('Dokumen telah diarsip');
      const nextVersion = doc.currentVersion + 1;
      await tx.documentVersion.create({ data: { documentId, version: nextVersion, fileUrl: dto.fileUrl, changeNote: dto.changeNote, createdById: actor.id } });
      return tx.document.update({ where: { id: documentId }, data: { currentVersion: nextVersion, status: DocumentStatus.DRAFT, approvedAt: null, approverId: null }, include: { versions: { orderBy: { version: 'desc' } } } });
    });
  }
  async submitForReview(id: string, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      const doc = await this.assertAccess(tx, id, actor, 'EDIT');
      if (doc.currentVersion < 1) throw new BadRequestException('Unggah minimal 1 versi sebelum review');
      return this.setStatus(tx, doc, DocumentStatus.IN_REVIEW);
    });
  }
  async approve(id: string, dto: ReviewDto, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      const doc = await this.assertAccess(tx, id, actor, 'REVIEW');
      return this.setStatus(tx, doc, DocumentStatus.APPROVED, { approverId: actor.id, approvedAt: new Date(), reviewNote: dto.note });
    });
  }
  async reject(id: string, dto: ReviewDto, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      const doc = await this.assertAccess(tx, id, actor, 'REVIEW');
      return this.setStatus(tx, doc, DocumentStatus.REJECTED, { approverId: actor.id, reviewNote: dto.note });
    });
  }
  async findAll(actor: AuthActor) {
    return this.prisma.withActor(actor, (tx) => tx.document.findMany({
      where: this.hasGlobalRead(actor) ? undefined : { OR: [{ ownerId: actor.id }, { accesses: { some: { userId: actor.id } } }] },
      orderBy: { updatedAt: 'desc' }, include: { owner: true },
    }));
  }
  async findOne(id: string, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      await this.assertAccess(tx, id, actor, 'READ');
      return tx.document.findUniqueOrThrow({ where: { id }, include: { versions: { orderBy: { version: 'desc' } }, owner: true, accesses: { include: { user: true } } } });
    });
  }
  async setAccess(id: string, dto: SetDocumentAccessDto, actor: AuthActor) {
    return this.prisma.withActor(actor, async (tx) => {
      await this.assertAccess(tx, id, actor, 'EDIT');
      if (dto.userId === actor.id) throw new BadRequestException('Owner tidak memerlukan grant tambahan');
      return tx.documentAccess.upsert({ where: { documentId_userId: { documentId: id, userId: dto.userId } }, update: { level: dto.level, grantedById: actor.id }, create: { documentId: id, userId: dto.userId, level: dto.level, grantedById: actor.id } });
    });
  }
  private hasGlobalRead(actor: AuthActor) { return actorHasAnyRole(actor, ['SUPER_ADMIN', 'COORDINATOR', 'DIRECTOR', 'AUDITOR']); }
  private hasGlobalAccess(actor: AuthActor, mode: AccessMode) {
    if (actorHasAnyRole(actor, ['SUPER_ADMIN', 'COORDINATOR'])) return true;
    if (mode === 'READ' && this.hasGlobalRead(actor)) return true;
    return mode === 'REVIEW' && actorHasAnyRole(actor, ['DIRECTOR']);
  }
  private async assertAccess(tx: Prisma.TransactionClient, id: string, actor: AuthActor, mode: AccessMode) {
    const doc = await tx.document.findUnique({ where: { id }, include: { accesses: { where: { userId: actor.id }, select: { level: true }, take: 1 } } });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    if (this.hasGlobalAccess(actor, mode) || doc.ownerId === actor.id || (doc.accesses[0] && ACCESS_RANK[doc.accesses[0].level] >= REQUIRED_RANK[mode])) return doc;
    throw new ForbiddenException('Anda tidak memiliki akses ke dokumen ini');
  }
  private setStatus(tx: Prisma.TransactionClient, doc: { id: string; status: DocumentStatus }, to: DocumentStatus, extra: Record<string, unknown> = {}) {
    if (!canTransition(doc.status, to)) throw new BadRequestException(`Transisi ${doc.status} → ${to} tidak diizinkan`);
    return tx.document.update({ where: { id: doc.id }, data: { status: to, ...extra } });
  }
}
