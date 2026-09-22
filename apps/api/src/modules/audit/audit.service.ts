import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditExecutionStatus, ComplianceResult, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { CreateFindingFromAnswerDto } from './dto/create-finding-from-answer.dto';
import { FindingsService } from '../findings/findings.service';

/** Bobot kepatuhan untuk perhitungan skor audit. NOT_APPLICABLE dikecualikan. */
const FACTOR: Record<ComplianceResult, number | null> = {
  COMPLIANT: 1,
  PARTIAL: 0.5,
  NON_COMPLIANT: 0,
  NOT_APPLICABLE: null,
};

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly findings: FindingsService,
  ) {}

  // ----- Penomoran -----
  private nextCode(prefix: 'CL' | 'AU', count: number, year: number): string {
    return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async generateChecklistCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.auditChecklist.count({ where: { createdAt: { gte: start } } });
    return this.nextCode('CL', count, year);
  }

  async generateExecutionCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.auditExecution.count({ where: { createdAt: { gte: start } } });
    return this.nextCode('AU', count, year);
  }

  // ----- Checklist (template) -----
  async createChecklist(dto: CreateChecklistDto) {
    if (!dto.items?.length) throw new BadRequestException('Checklist minimal memiliki satu butir');
    const code = await this.generateChecklistCode();
    return this.prisma.auditChecklist.create({
      data: {
        code,
        title: dto.title,
        category: dto.category,
        description: dto.description,
        items: {
          create: dto.items.map((it, idx) => ({
            order: it.order ?? idx + 1,
            question: it.question,
            guidance: it.guidance,
            weight: it.weight ?? 1,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  listChecklists() {
    return this.prisma.auditChecklist.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true, executions: true } } },
    });
  }

  getChecklist(id: string) {
    return this.prisma.auditChecklist.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  // ----- Pelaksanaan audit -----
  async createExecution(dto: CreateExecutionDto, auditorId?: string) {
    const checklist = await this.prisma.auditChecklist.findUnique({
      where: { id: dto.checklistId },
      include: { items: true },
    });
    if (!checklist) throw new NotFoundException('Checklist tidak ditemukan');
    if (checklist.items.length === 0) throw new BadRequestException('Checklist belum memiliki butir');

    const code = await this.generateExecutionCode();
    return this.prisma.auditExecution.create({
      data: {
        code,
        checklistId: checklist.id,
        auditeeUnit: dto.auditeeUnit,
        zone: dto.zone,
        auditorId,
        status: AuditExecutionStatus.DRAFT,
        // Inisialisasi jawaban per butir (default NOT_APPLICABLE).
        answers: {
          create: checklist.items.map((it) => ({ itemId: it.id, result: ComplianceResult.NOT_APPLICABLE })),
        },
      },
      include: this.executionInclude(),
    });
  }

  listExecutions(params: { status?: AuditExecutionStatus } = {}) {
    const where: Prisma.AuditExecutionWhereInput = {};
    if (params.status) where.status = params.status;
    return this.prisma.auditExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        checklist: { select: { code: true, title: true, category: true } },
        auditor: { select: { name: true } },
        _count: { select: { evidences: true, answers: true } },
      },
    });
  }

  getExecution(id: string) {
    return this.prisma.auditExecution.findUniqueOrThrow({
      where: { id },
      include: this.executionInclude(),
    });
  }

  private executionInclude() {
    return {
      checklist: { select: { code: true, title: true, category: true } },
      auditor: { select: { name: true } },
      answers: {
        include: {
          item: true,
          evidences: true,
          finding: { select: { id: true, code: true, riskLevel: true } },
        },
        orderBy: { item: { order: 'asc' } },
      },
      evidences: { orderBy: { createdAt: 'desc' } },
    } satisfies Prisma.AuditExecutionInclude;
  }

  /** Simpan jawaban (upsert per butir) lalu hitung ulang skor. */
  async submitAnswers(executionId: string, dto: SubmitAnswersDto) {
    const exec = await this.prisma.auditExecution.findUnique({ where: { id: executionId } });
    if (!exec) throw new NotFoundException('Pelaksanaan audit tidak ditemukan');
    if (exec.status === AuditExecutionStatus.COMPLETED) {
      throw new BadRequestException('Audit sudah diselesaikan dan tidak dapat diubah');
    }

    await this.prisma.$transaction(
      dto.answers.map((a) =>
        this.prisma.auditAnswer.upsert({
          where: { executionId_itemId: { executionId, itemId: a.itemId } },
          create: { executionId, itemId: a.itemId, result: a.result, note: a.note },
          update: { result: a.result, note: a.note },
        }),
      ),
    );

    await this.prisma.auditExecution.update({
      where: { id: executionId },
      data: { status: AuditExecutionStatus.IN_PROGRESS },
    });
    return this.recomputeScore(executionId);
  }

  /** Selesaikan audit: kunci, hitung skor final, set waktu selesai. */
  async completeExecution(executionId: string) {
    const exec = await this.prisma.auditExecution.findUnique({ where: { id: executionId } });
    if (!exec) throw new NotFoundException('Pelaksanaan audit tidak ditemukan');
    await this.prisma.auditExecution.update({
      where: { id: executionId },
      data: { status: AuditExecutionStatus.COMPLETED, completedAt: new Date() },
    });
    return this.recomputeScore(executionId);
  }

  /** Hitung skor kepatuhan tertimbang (0..100). */
  private async recomputeScore(executionId: string) {
    const answers = await this.prisma.auditAnswer.findMany({
      where: { executionId },
      include: { item: { select: { weight: true } } },
    });
    let totalWeight = 0;
    let earned = 0;
    for (const a of answers) {
      const factor = FACTOR[a.result];
      if (factor === null) continue; // NOT_APPLICABLE dikecualikan
      const w = a.item.weight ?? 1;
      totalWeight += w;
      earned += w * factor;
    }
    const scorePct = totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 1000) / 10;
    return this.prisma.auditExecution.update({
      where: { id: executionId },
      data: { scorePct },
      include: this.executionInclude(),
    });
  }

  /** Jumlah butir tidak patuh — kandidat untuk dijadikan temuan. */
  async nonCompliantCount(executionId: string): Promise<number> {
    return this.prisma.auditAnswer.count({
      where: { executionId, result: ComplianceResult.NON_COMPLIANT },
    });
  }

  /**
   * Ubah satu butir audit NON_COMPLIANT menjadi Temuan (Finding).
   * Menutup alur audit -> tindak lanjut: deskripsi dibentuk otomatis dari
   * pertanyaan butir + catatan auditor bila tidak di-override. Satu butir
   * hanya dapat menjadi satu temuan (dijaga oleh relasi unik auditAnswerId).
   */
  async createFindingFromAnswer(
    executionId: string,
    answerId: string,
    dto: CreateFindingFromAnswerDto,
  ) {
    const answer = await this.prisma.auditAnswer.findFirst({
      where: { id: answerId, executionId },
      include: {
        item: true,
        finding: { select: { code: true } },
        execution: { select: { code: true, auditeeUnit: true } },
      },
    });
    if (!answer) {
      throw new NotFoundException('Butir jawaban tidak ditemukan pada pelaksanaan audit ini');
    }
    if (answer.result !== ComplianceResult.NON_COMPLIANT) {
      throw new BadRequestException(
        'Hanya butir berstatus Tidak Patuh (NON_COMPLIANT) yang dapat dijadikan temuan',
      );
    }
    if (answer.finding) {
      throw new BadRequestException(`Butir ini sudah dijadikan temuan (${answer.finding.code})`);
    }

    const autoDesc =
      `[${answer.execution.code} \u00b7 ${answer.execution.auditeeUnit}] ${answer.item.question}` +
      (answer.note ? ` \u2014 ${answer.note}` : '');
    const description = dto.description?.trim() || autoDesc;

    return this.findings.create(
      {
        description,
        category: dto.category,
        rootCause: dto.rootCause,
        probability: dto.probability,
        impact: dto.impact,
        picId: dto.picId,
        deadline: dto.deadline,
      },
      { auditAnswerId: answer.id },
    );
  }

  // ----- Evidence Capture -----
  async addEvidence(executionId: string, dto: AddEvidenceDto, uploadedById?: string) {
    const exec = await this.prisma.auditExecution.findUnique({ where: { id: executionId } });
    if (!exec) throw new NotFoundException('Pelaksanaan audit tidak ditemukan');
    if (dto.answerId) {
      const ans = await this.prisma.auditAnswer.findFirst({
        where: { id: dto.answerId, executionId },
      });
      if (!ans) throw new BadRequestException('Butir jawaban tidak sesuai pelaksanaan audit ini');
    }
    return this.prisma.evidence.create({
      data: {
        executionId,
        answerId: dto.answerId,
        fileUrl: dto.fileUrl,
        caption: dto.caption,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : new Date(),
        uploadedById,
      },
    });
  }

  listEvidence(executionId: string) {
    return this.prisma.evidence.findMany({
      where: { executionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteEvidence(executionId: string, evidenceId: string) {
    const ev = await this.prisma.evidence.findFirst({ where: { id: evidenceId, executionId } });
    if (!ev) throw new NotFoundException('Bukti tidak ditemukan');
    await this.prisma.evidence.delete({ where: { id: evidenceId } });
    return { ok: true };
  }
}
