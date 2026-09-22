import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ReferralStatus } from '@prisma/client';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Post()
  @Roles('HEALTH_WORKER', 'COORDINATOR', 'SUPER_ADMIN')
  create(@Body() dto: CreateReferralDto) {
    return this.referral.create(dto);
  }

  @Get()
  @Roles('HEALTH_WORKER', 'COORDINATOR', 'DIRECTOR', 'SUPER_ADMIN')
  findAll() {
    return this.referral.findAll();
  }

  @Get(':id')
  @Roles('HEALTH_WORKER', 'COORDINATOR', 'DIRECTOR', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.referral.findOne(id);
  }

  @Patch(':id/status/:status')
  @Roles('COORDINATOR', 'SUPER_ADMIN')
  setStatus(@Param('id') id: string, @Param('status') status: ReferralStatus) {
    return this.referral.setStatus(id, status);
  }
}
