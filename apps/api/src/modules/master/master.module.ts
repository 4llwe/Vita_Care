import { Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { MasterAdminController } from './master-admin.controller';
import { MasterService } from './master.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [MasterController, MasterAdminController],
  providers: [MasterService, PrismaService],
  exports: [MasterService],
})
export class MasterModule {}
