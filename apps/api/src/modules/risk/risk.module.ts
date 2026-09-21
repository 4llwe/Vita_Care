import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskService } from './risk.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [RiskController],
  providers: [RiskService, PrismaService],
  exports: [RiskService],
})
export class RiskModule {}
