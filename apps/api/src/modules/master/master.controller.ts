import { Controller, Get, UseGuards } from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/** Endpoint master data read-only untuk mengisi dropdown di frontend. */
@Controller()
@UseGuards(JwtAuthGuard)
export class MasterController {
  constructor(private readonly master: MasterService) {}

  @Get('services')
  services() {
    return this.master.listServices();
  }

  @Get('zones')
  zones() {
    return this.master.listZones();
  }

  @Get('health-workers')
  healthWorkers() {
    return this.master.listHealthWorkers();
  }
}
