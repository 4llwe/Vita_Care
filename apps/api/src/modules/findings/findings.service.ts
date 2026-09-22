import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { RiskLevel, Prisma } from '@prisma/client';

@Injectable()
export class FindingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Matriks Probability x Impact -> RiskLevel */
  static calcRisk(probability: number, impact: number): RiskLevel {
    const score = probability * impact;
    if (score <= 4) return RiskLevel.LOW;
    if (score <= 9) return RiskLevel.MEDIUM;
    if (score <= 15) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /** Penomoran otomatis: TM-<tahun>-<urut 3 digit> */
  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.finding.count({ where: { createdAt: { gte: start } } });
    return `TM-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateFindingDto, extra: { auditAnswerId?: string } = {}) {
    const code = await this.generateCode();
    const riskLevel = FindingsService.calcRisk(dto.probability, dto.impact);
    return this.prisma.finding.create({
      data: {
        code,
        description: dto.description,
        category: dto.category,
        rootCause: dto.rootCause,
        probability: dto.probability,
        impact: dto.impact,
        riskLevel,
        picId: dto.picId,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        auditAnswerId: extra.auditAnswerId,
      },
    });
  }

  findAll(params: { category?: string; riskLevel?: RiskLevel } = {}) {
    const where: Prisma.FindingWhereInput = {};
    if (params.category) where.category = params.category as any;
    if (params.riskLevel) where.riskLevel = params.riskLevel;
    return this.prisma.finding.findMany({ where, orderBy: { createdAt: 'desc' }, include: { pic: true, capa: true } });
  }

  findOne(id: string) {
    return this.prisma.finding.findUniqueOrThrow({ where: { id }, include: { pic: true, capa: true } });
  }
}
