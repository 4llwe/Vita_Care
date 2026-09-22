import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { computeEws } from './ews';

@Injectable()
export class MedicalRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecordDto) {
    const ews = computeEws(dto);
    return this.prisma.medicalRecord.create({
      data: {
        bookingId: dto.bookingId,
        patientName: dto.patientName,
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        systolic: dto.systolic,
        diastolic: dto.diastolic,
        heartRate: dto.heartRate,
        respRate: dto.respRate,
        temperature: dto.temperature,
        spo2: dto.spo2,
        consciousness: dto.consciousness,
        ewsScore: ews.score,
        ewsRisk: ews.risk,
      },
    });
  }

  /** Rekam medis yang sudah dikunci tidak boleh diubah (integritas data). */
  async update(id: string, dto: Partial<CreateRecordDto>) {
    const rec = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Rekam medis tidak ditemukan');
    if (rec.locked) throw new ForbiddenException('Rekam medis sudah dikunci dan tidak dapat diubah');

    const merged = { ...rec, ...dto } as CreateRecordDto;
    const ews = computeEws(merged);
    return this.prisma.medicalRecord.update({
      where: { id },
      data: { ...dto, ewsScore: ews.score, ewsRisk: ews.risk },
    });
  }

  /** Tanda tangan digital + kunci rekam medis (tidak dapat diubah lagi). */
  async sign(id: string, signerId: string) {
    const rec = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('Rekam medis tidak ditemukan');
    if (rec.locked) throw new BadRequestException('Rekam medis sudah ditandatangani');
    return this.prisma.medicalRecord.update({
      where: { id },
      data: { signedById: signerId, signedAt: new Date(), locked: true },
    });
  }

  findOne(id: string) {
    return this.prisma.medicalRecord.findUniqueOrThrow({ where: { id }, include: { signedBy: true } });
  }
}
