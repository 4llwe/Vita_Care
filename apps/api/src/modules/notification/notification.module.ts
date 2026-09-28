import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JobQueueModule } from '../../common/jobs/job-queue.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [JobQueueModule],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationModule {}
