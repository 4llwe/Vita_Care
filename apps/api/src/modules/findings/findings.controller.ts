import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RiskLevel } from '@prisma/client';

@Controller('findings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FindingsController {
  constructor(private readonly findings: FindingsService) {}

  @Post()
  @Roles('AUDITOR', 'SUPER_ADMIN')
  create(@Body() dto: CreateFindingDto) {
    return this.findings.create(dto);
  }

  @Get()
  @Roles('AUDITOR', 'DIRECTOR', 'SUPERVISORY_BOARD', 'UNIT_HEAD', 'SUPER_ADMIN')
  findAll(@Query('category') category?: string, @Query('riskLevel') riskLevel?: RiskLevel) {
    return this.findings.findAll({ category, riskLevel });
  }

  @Get(':id')
  @Roles('AUDITOR', 'DIRECTOR', 'SUPERVISORY_BOARD', 'UNIT_HEAD', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.findings.findOne(id);
  }
}
