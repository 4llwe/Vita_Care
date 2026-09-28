import { NestFactory } from '@nestjs/core';
import { validateEnvironment } from './common/config/validate-env';
import { JobWorkerModule } from './common/jobs/job-worker.module';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.createApplicationContext(JobWorkerModule, { bufferLogs: true });
  app.enableShutdownHooks();
  console.log(JSON.stringify({ event: 'worker_ready', service: 'vitacare-jobs' }));
}

void bootstrap().catch((error) => {
  console.error(
    JSON.stringify({
      event: 'worker_bootstrap_failed',
      message: error instanceof Error ? error.message : 'unknown',
    }),
  );
  process.exit(1);
});
