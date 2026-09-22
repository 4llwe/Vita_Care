import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CapaService } from './capa.service';
import { CreateCapaDto } from './dto/create-capa.dto';
import { UpdateCapaProgressDto } from './dto/update-capa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('capa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CapaController {
  constructor(private readonly capa: CapaService) {}

  @Post()
  @Roles('AUDITOR', 'UNIT_HEAD', 'SUPER_ADMIN')
  create(@Body() dto: CreateCapaDto) {
    return this.capa.create(dto);
  }

  @Patch(':id/progress')
  @Roles('UNIT_HEAD', 'HEALTH_WORKER', 'SUPER_ADMIN')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateCapaProgressDto) {
    return this.capa.updateProgress(id, dto);
  }

  @Get()
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  findAll() {
    return this.capa.findAll();
  }
}
