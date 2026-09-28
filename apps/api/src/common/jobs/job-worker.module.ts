import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CapaModule } from '../../modules/capa/capa.module';
import { NotificationModule } from '../../modules/notification/notification.module';
import { HaHModule } from '../../modules/hah/hah.module';
import { JobQueueModule } from './job-queue.module';
import { JobWorkerService } from './job-worker.service';

@Module({
  imports: [JobQueueModule, NotificationModule, CapaModule, HaHModule],
  providers: [PrismaService, JobWorkerService],
})
export class JobWorkerModule {}
