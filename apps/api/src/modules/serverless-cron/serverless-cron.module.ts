import { Module } from "@nestjs/common";
import { CapaModule } from "../capa/capa.module";
import { HaHModule } from "../hah/hah.module";
import { NotificationModule } from "../notification/notification.module";
import { ServerlessCronController } from "./serverless-cron.controller";

@Module({
  imports: [NotificationModule, HaHModule, CapaModule],
  controllers: [ServerlessCronController],
})
export class ServerlessCronModule {}