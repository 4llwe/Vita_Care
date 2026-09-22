import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'DIRECTOR')
  create(@Body() dto: CreateInvoiceDto) {
    return this.billing.createInvoice(dto);
  }

  @Post('invoices/:id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT', 'COORDINATOR', 'SUPER_ADMIN')
  pay(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.billing.pay(id, user);
  }

  @Get('invoices/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT')
  mine(@CurrentUser() user: { id: string }) { return this.billing.myInvoices(user.id); }

  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PATIENT', 'COORDINATOR', 'SUPER_ADMIN', 'DIRECTOR', 'AUDITOR')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.billing.findOne(id, user);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'DIRECTOR', 'AUDITOR')
  findAll() {
    return this.billing.findAll();
  }

  /** Endpoint webhook Midtrans — publik, diamankan via verifikasi signature. */
  @Post('billing/webhook')
  @HttpCode(200)
  webhook(@Body() body: any, @Req() _req: unknown) {
    return this.billing.handleWebhook(body);
  }
}
