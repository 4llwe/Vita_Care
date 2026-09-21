import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { NotificationModule } from '../notification/notification.module';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  imports: [NotificationModule],
  controllers: [ReferralController],
  providers: [ReferralService, PrismaService],
  exports: [ReferralService],
})
export class ReferralModule {}
