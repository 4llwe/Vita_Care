import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { JOB_NAMES, JOB_QUEUE } from './job-queue.constants';
import { createRedisConnection } from './redis-connection';

const deliveryOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnComplete: true,
  removeOnFail: { age: 7 * 24 * 3600, count: 5000 },
};

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private readonly connection = createRedisConnection();
  readonly queue = new Queue(JOB_QUEUE, { connection: this.connection });

  enqueueDelivery(deliveryId: string) {
    return this.queue.add(
      JOB_NAMES.notificationDelivery,
      { deliveryId },
      { ...deliveryOptions, jobId: `notification-${deliveryId}` },
    );
  }

  async enqueueDeliveryBestEffort(deliveryId: string) {
    try {
      await this.enqueueDelivery(deliveryId);
    } catch (error) {
      this.logger.error(
        `Redis enqueue gagal untuk delivery ${deliveryId}; rekonsiliasi worker akan mencoba lagi`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async registerSchedulers() {
    await this.queue.upsertJobScheduler(
      'notification-reconcile-every-30s',
      { every: 30_000 },
      { name: JOB_NAMES.notificationReconcile, data: {}, opts: deliveryOptions },
    );
    await this.queue.upsertJobScheduler(
      'hah-alert-escalation-every-60s',
      { every: 60_000 },
      { name: JOB_NAMES.hahAlertEscalation, data: {}, opts: deliveryOptions },
    );
    await this.queue.upsertJobScheduler(
      'hah-medication-schedule-every-5m',
      { every: 5 * 60_000 },
      { name: JOB_NAMES.hahMedicationSchedule, data: {}, opts: deliveryOptions },
    );
    await this.queue.upsertJobScheduler(
      'capa-daily-asia-makassar',
      { pattern: '0 8 * * *', tz: 'Asia/Makassar' },
      { name: JOB_NAMES.capaDaily, data: {}, opts: deliveryOptions },
    );
  }

  async ping() {
    return this.connection.ping();
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit().catch(() => undefined);
  }
}
