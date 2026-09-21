import { Module } from '@nestjs/common';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [FindingsController],
  providers: [FindingsService, PrismaService],
  exports: [FindingsService],
})
export class FindingsModule {}
