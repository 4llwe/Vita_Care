import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FindingsModule } from '../findings/findings.module';

@Module({
  imports: [FindingsModule],
  controllers: [AuditController],
  providers: [AuditService, PrismaService],
  exports: [AuditService],
})
export class AuditModule {}
