import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [DocumentController],
  providers: [DocumentService, PrismaService],
  exports: [DocumentService],
})
export class DocumentModule {}
