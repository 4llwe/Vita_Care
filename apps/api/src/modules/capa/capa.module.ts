import { Module } from '@nestjs/common';
import { CapaController } from './capa.controller';
import { CapaService } from './capa.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  imports: [NotificationModule],
  controllers: [CapaController],
  providers: [CapaService, PrismaService],
  exports: [CapaService],
})
export class CapaModule {}
