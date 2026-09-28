import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { JobQueueService } from '../../common/jobs/job-queue.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: JobQueueService,
  ) {}

  @Get()
  live() {
    return { status: 'ok', service: 'vitacare-api', time: new Date().toISOString() };
  }

  @Get('ready')
  async ready() {
    try {
      await Promise.all([this.prisma.$queryRaw`SELECT 1`, this.queue.ping()]);
      const [pending, processing, failed] = await Promise.all([
        this.prisma.notificationDelivery.count({
          where: { status: { in: ['PENDING', 'RETRY'] } },
        }),
        this.prisma.notificationDelivery.count({ where: { status: 'PROCESSING' } }),
        this.prisma.notificationDelivery.count({ where: { status: 'FAILED' } }),
      ]);
      if (pending > 1000 || failed > 100) {
        throw new ServiceUnavailableException({
          status: 'degraded',
          db: 'up',
          redis: 'up',
          notificationQueue: { pending, processing, failed },
        });
      }
      return {
        status: 'ready',
        db: 'up',
        redis: 'up',
        version: process.env.APP_VERSION ?? 'unknown',
        revision: process.env.GIT_SHA ?? 'unknown',
        notificationQueue: { pending, processing, failed },
        providers: {
          email: Boolean(process.env.EMAIL_API_URL && process.env.EMAIL_API_TOKEN),
          whatsapp: Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_TOKEN),
          storage: Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY),
        },
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException({ status: 'degraded', dependency: 'db-or-redis' });
    }
  }
}
