import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReportingService, PrismaService],
  exports: [AnalyticsService, ReportingService],
})
export class AnalyticsModule {}
