import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RiskStatus } from '@prisma/client';
import { RiskService } from './risk.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('risks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  @Post()
  @Roles('AUDITOR', 'UNIT_HEAD', 'SUPER_ADMIN')
  create(@Body() dto: CreateRiskDto) {
    return this.risk.create(dto);
  }

  @Get()
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  findAll() {
    return this.risk.findAll();
  }

  @Get('heatmap')
  @Roles('AUDITOR', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  heatmap() {
    return this.risk.heatmap();
  }

  @Patch(':id/status/:status')
  @Roles('AUDITOR', 'UNIT_HEAD', 'SUPER_ADMIN')
  setStatus(@Param('id') id: string, @Param('status') status: RiskStatus) {
    return this.risk.setStatus(id, status);
  }
}
