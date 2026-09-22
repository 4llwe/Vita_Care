import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordController {
  constructor(private readonly records: MedicalRecordService) {}

  @Post()
  @Roles('HEALTH_WORKER', 'SUPER_ADMIN')
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: { id: string; role: string }) {
    return this.records.create(dto, user);
  }

  @Patch(':id')
  @Roles('HEALTH_WORKER', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRecordDto>, @CurrentUser() user: { id: string; role: string }) {
    return this.records.update(id, dto, user);
  }

  @Patch(':id/sign')
  @Roles('HEALTH_WORKER', 'SUPER_ADMIN')
  sign(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.records.sign(id, user);
  }

  @Get(':id')
  @Roles('HEALTH_WORKER', 'AUDITOR', 'DIRECTOR', 'SUPER_ADMIN')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.records.findOne(id, user);
  }
}
