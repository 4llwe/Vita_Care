import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDocumentDto, NewVersionDto, ReviewDto } from './dto/create-document.dto';

/** Transisi status dokumen yang diizinkan. */
export const DOC_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ['IN_REVIEW', 'ARCHIVED'],
  IN_REVIEW: ['APPROVED', 'REJECTED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  APPROVED: ['ARCHIVED', 'DRAFT'], // DRAFT = mulai revisi baru
  ARCHIVED: [],
};

export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return DOC_TRANSITIONS[from]?.includes(to) ?? false;
}

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.document.count({ where: { createdAt: { gte: start } } });
    return `DOC-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateDocumentDto) {
    const code = await this.generateCode();
    return this.prisma.document.create({
      data: { code, title: dto.title, category: dto.category, ownerId: dto.ownerId, status: DocumentStatus.DRAFT },
    });
  }

  /** Tambah versi baru; menaikkan nomor versi & mengembalikan dokumen ke DRAFT. */
  async addVersion(documentId: string, dto: NewVersionDto) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    if (doc.status === DocumentStatus.ARCHIVED) throw new BadRequestException('Dokumen telah diarsip');

    const nextVersion = doc.currentVersion + 1;
    await this.prisma.documentVersion.create({
      data: {
        documentId,
        version: nextVersion,
        fileUrl: dto.fileUrl,
        changeNote: dto.changeNote,
        createdById: dto.createdById,
      },
    });
    return this.prisma.document.update({
      where: { id: documentId },
      data: { currentVersion: nextVersion, status: DocumentStatus.DRAFT, approvedAt: null, approverId: null },
      include: { versions: { orderBy: { version: 'desc' } } },
    });
  }

  private async setStatus(id: string, to: DocumentStatus, extra: Record<string, unknown> = {}) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Dokumen tidak ditemukan');
    if (!canTransition(doc.status, to)) {
      throw new BadRequestException(`Transisi ${doc.status} → ${to} tidak diizinkan`);
    }
    return this.prisma.document.update({ where: { id }, data: { status: to, ...extra } });
  }

  async submitForReview(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (doc && doc.currentVersion < 1) throw new BadRequestException('Unggah minimal 1 versi sebelum review');
    return this.setStatus(id, DocumentStatus.IN_REVIEW);
  }

  approve(id: string, dto: ReviewDto) {
    return this.setStatus(id, DocumentStatus.APPROVED, { approverId: dto.approverId, approvedAt: new Date(), reviewNote: dto.note });
  }

  reject(id: string, dto: ReviewDto) {
    return this.setStatus(id, DocumentStatus.REJECTED, { reviewNote: dto.note });
  }

  findAll() {
    return this.prisma.document.findMany({ orderBy: { updatedAt: 'desc' }, include: { owner: true } });
  }

  findOne(id: string) {
    return this.prisma.document.findUniqueOrThrow({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' } }, owner: true },
    });
  }
}
