import { Controller, Get, Header, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthActor } from '../../common/auth/actor';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly reporting: ReportingService,
  ) {}

  @Get('analytics/dashboard')
  @Roles(
    'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN', 'AUDITOR', 'UNIT_HEAD',
    'COORDINATOR', 'HEALTH_WORKER', 'DOCTOR', 'NURSE', 'FINANCE', 'PATIENT', 'CAREGIVER',
  )
  dashboard(@CurrentUser() actor: AuthActor) {
    return this.analytics.dashboard(actor);
  }

  @Get('analytics/master')
  @Roles('DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN', 'COORDINATOR')
  masterAnalytics() {
    return this.analytics.masterAnalytics();
  }

  @Get('reports/findings.csv')
  @Roles('AUDITOR', 'DIRECTOR', 'SUPER_ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="findings.csv"')
  findingsCsv() {
    return this.reporting.findingsCsv();
  }

  @Get('reports/invoices.csv')
  @Roles('DIRECTOR', 'SUPER_ADMIN', 'COORDINATOR')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="invoices.csv"')
  invoicesCsv() {
    return this.reporting.invoicesCsv();
  }

  @Get('reports/risks.csv')
  @Roles('AUDITOR', 'DIRECTOR', 'SUPER_ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="risks.csv"')
  risksCsv() {
    return this.reporting.risksCsv();
  }

  // ============ Export PDF / Excel berbranding ============

  @Get('reports/management.pdf')
  @Roles('DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  async managementPdf(@Res() res: Response) {
    const buffer = await this.reporting.managementReportPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-manajemen.pdf"',
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('reports/risks.xlsx')
  @Roles('AUDITOR', 'DIRECTOR', 'SUPER_ADMIN')
  async risksXlsx(@Res() res: Response) {
    const buffer = await this.reporting.risksXlsx();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="register-risiko.xlsx"',
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('reports/referral/:id.pdf')
  @Roles('HEALTH_WORKER', 'DOCTOR', 'NURSE', 'COORDINATOR', 'DIRECTOR', 'SUPER_ADMIN')
  async referralPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, code } = await this.reporting.referralPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="surat-rujukan-${code}.pdf"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }
}
