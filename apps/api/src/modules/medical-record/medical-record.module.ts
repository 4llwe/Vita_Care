import { Module } from '@nestjs/common';
import { MedicalRecordController } from './medical-record.controller';
import { MedicalRecordService } from './medical-record.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService, PrismaService],
  exports: [MedicalRecordService],
})
export class MedicalRecordModule {}
