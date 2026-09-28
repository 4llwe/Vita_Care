import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { CapaService } from '../../modules/capa/capa.service';
import { NotificationService } from '../../modules/notification/notification.service';
import { HaHService } from '../../modules/hah/hah.service';
import { DeliveryJob, JOB_NAMES, JOB_QUEUE } from './job-queue.constants';
import { JobQueueService } from './job-queue.service';
import { createRedisConnection } from './redis-connection';

@Injectable()
export class JobWorkerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobWorkerService.name);
  private readonly connection = createRedisConnection();
  private worker?: Worker;

  constructor(
    private readonly queue: JobQueueService,
    private readonly notifications: NotificationService,
    private readonly capa: CapaService,
    private readonly hah: HaHService,
  ) {}

  async onApplicationBootstrap() {
    await this.queue.registerSchedulers();
    this.worker = new Worker(
      JOB_QUEUE,
      (job) => this.process(job),
      { connection: this.connection, concurrency: Number(process.env.JOB_CONCURRENCY || '10') },
    );
    this.worker.on('failed', (job, error) =>
      this.logger.error(`Job ${job?.id ?? 'unknown'} gagal: ${error.message}`),
    );
    this.logger.log('Durable job worker aktif');
  }

  private async process(job: Job) {
    if (job.name === JOB_NAMES.notificationDelivery) {
      return this.notifications.processDelivery((job.data as DeliveryJob).deliveryId);
    }
    if (job.name === JOB_NAMES.notificationReconcile) {
      const ids = await this.notifications.reconcileDue();
      await Promise.all(ids.map((id) => this.queue.enqueueDelivery(id)));
      return { enqueued: ids.length };
    }
    if (job.name === JOB_NAMES.capaDaily) return this.capa.runDailyReminders();
    if (job.name === JOB_NAMES.hahAlertEscalation) {
      return this.hah.escalateOverdueAlerts();
    }
    throw new Error(`Jenis job tidak dikenal: ${job.name}`);
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection.quit().catch(() => undefined);
  }
}
