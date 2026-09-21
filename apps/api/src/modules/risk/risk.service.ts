import { Injectable, NotFoundException } from '@nestjs/common';
import { RiskLevel, RiskStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { computeRiskLevel } from '../../common/risk/risk-level';
import { CreateRiskDto } from './dto/create-risk.dto';

export type HeatmapCell = { probability: number; impact: number; count: number; level: RiskLevel };

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCode(now = new Date()): Promise<string> {
    const year = now.getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const count = await this.prisma.riskRegister.count({ where: { createdAt: { gte: start } } });
    return `RR-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(dto: CreateRiskDto) {
    const score = dto.probability * dto.impact;
    const level = computeRiskLevel(dto.probability, dto.impact);
    const code = await this.generateCode();
    return this.prisma.riskRegister.create({
      data: {
        code,
        title: dto.title,
        category: dto.category,
        probability: dto.probability,
        impact: dto.impact,
        score,
        level,
        mitigation: dto.mitigation,
        ownerId: dto.ownerId,
        status: RiskStatus.OPEN,
      },
    });
  }

  async setStatus(id: string, status: RiskStatus) {
    const risk = await this.prisma.riskRegister.findUnique({ where: { id } });
    if (!risk) throw new NotFoundException('Risiko tidak ditemukan');
    return this.prisma.riskRegister.update({ where: { id }, data: { status } });
  }

  findAll() {
    return this.prisma.riskRegister.findMany({ orderBy: { score: 'desc' }, include: { owner: true } });
  }

  /** Bangun matriks heatmap 5x5 (probability x impact) berisi jumlah risiko per sel. */
  async heatmap(): Promise<HeatmapCell[]> {
    const risks = await this.prisma.riskRegister.findMany({
      where: { status: { not: RiskStatus.CLOSED } },
      select: { probability: true, impact: true },
    });
    const cells: HeatmapCell[] = [];
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        const count = risks.filter((r) => r.probability === p && r.impact === i).length;
        cells.push({ probability: p, impact: i, count, level: computeRiskLevel(p, i) });
      }
    }
    return cells;
  }
}
