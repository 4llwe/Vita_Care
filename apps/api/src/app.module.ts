import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditTrailInterceptor } from "./common/interceptors/audit-trail.interceptor";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaService } from "./common/prisma/prisma.service";
import { AuthModule } from "./modules/auth/auth.module";
import { FindingsModule } from "./modules/findings/findings.module";
import { BookingModule } from "./modules/booking/booking.module";
import { MedicalRecordModule } from "./modules/medical-record/medical-record.module";
import { CapaModule } from "./modules/capa/capa.module";
import { BillingModule } from "./modules/billing/billing.module";
import { RiskModule } from "./modules/risk/risk.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { DocumentModule } from "./modules/document/document.module";
import { ReferralModule } from "./modules/referral/referral.module";
import { MasterModule } from "./modules/master/master.module";
import { StorageModule } from "./modules/storage/storage.module";
import { AuditModule } from "./modules/audit/audit.module";
import { HealthModule } from "./modules/health/health.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { HaHModule } from "./modules/hah/hah.module";
import { PublicRequestModule } from "./modules/public-request/public-request.module";
import { MenuModule } from "./modules/menu/menu.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    NotificationModule,
    HaHModule,
    PublicRequestModule,
    MenuModule,
    AuthModule,
    FindingsModule,
    BookingModule,
    MedicalRecordModule,
    CapaModule,
    BillingModule,
    RiskModule,
    AnalyticsModule,
    DocumentModule,
    ReferralModule,
    MasterModule,
    StorageModule,
    AuditModule,
    HealthModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_INTERCEPTOR, useClass: AuditTrailInterceptor },
  ],
})
export class AppModule {}
