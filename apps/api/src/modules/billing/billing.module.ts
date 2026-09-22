import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  imports: [NotificationModule],
  controllers: [BillingController],
  providers: [BillingService, PaymentService, PrismaService],
  exports: [BillingService],
})
export class BillingModule {}
