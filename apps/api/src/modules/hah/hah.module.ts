import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationModule } from "../notification/notification.module";
import { HaHController } from "./hah.controller";
import { HaHAccessGuard } from "./hah-access.guard";
import { HaHService } from "./hah.service";

@Module({
  imports: [NotificationModule],
  controllers: [HaHController],
  providers: [HaHService, HaHAccessGuard, PrismaService],
  exports: [HaHService],
})
export class HaHModule {}
