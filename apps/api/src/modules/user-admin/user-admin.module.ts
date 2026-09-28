import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserAdminController } from './user-admin.controller';
import { UserAdminService } from './user-admin.service';

@Module({
  controllers: [UserAdminController],
  providers: [UserAdminService, PrismaService],
})
export class UserAdminModule {}
