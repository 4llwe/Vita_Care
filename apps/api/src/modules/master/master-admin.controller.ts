import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { CreateTariffDto, UpdateTariffDto } from './dto/tariff.dto';
import { CreateHealthWorkerDto, UpdateHealthWorkerDto } from './dto/health-worker.dto';

/** Manajemen master data (CRUD) untuk admin & koordinator. */
@Controller('master')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COORDINATOR')
export class MasterAdminController {
  constructor(private readonly master: MasterService) {}

  // ----- Layanan -----
  @Get('services')
  services() {
    return this.master.listAllServices();
  }

  @Post('services')
  createService(@Body() dto: CreateServiceDto) {
    return this.master.createService(dto);
  }

  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.master.updateService(id, dto);
  }

  @Delete('services/:id')
  removeService(@Param('id') id: string) {
    return this.master.removeService(id);
  }

  // ----- Tarif -----
  @Post('tariffs')
  createTariff(@Body() dto: CreateTariffDto) {
    return this.master.createTariff(dto);
  }

  @Patch('tariffs/:id')
  updateTariff(@Param('id') id: string, @Body() dto: UpdateTariffDto) {
    return this.master.updateTariff(id, dto);
  }

  @Delete('tariffs/:id')
  removeTariff(@Param('id') id: string) {
    return this.master.removeTariff(id);
  }

  // ----- Tenaga Kesehatan -----
  @Get('health-workers')
  healthWorkers() {
    return this.master.listAllHealthWorkers();
  }

  @Post('health-workers')
  createHealthWorker(@Body() dto: CreateHealthWorkerDto) {
    return this.master.createHealthWorker(dto);
  }

  @Patch('health-workers/:id')
  updateHealthWorker(@Param('id') id: string, @Body() dto: UpdateHealthWorkerDto) {
    return this.master.updateHealthWorker(id, dto);
  }

  @Delete('health-workers/:id')
  removeHealthWorker(@Param('id') id: string) {
    return this.master.removeHealthWorker(id);
  }
}
