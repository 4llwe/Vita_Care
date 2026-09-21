import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationModule } from "../notification/notification.module";
import { PublicRequestController } from "./public-request.controller";
import { PublicRequestService } from "./public-request.service";
@Module({
  imports: [NotificationModule],
  controllers: [PublicRequestController],
  providers: [PublicRequestService, PrismaService],
})
export class PublicRequestModule {}
