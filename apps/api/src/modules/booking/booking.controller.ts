import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SelfBookingDto } from './dto/self-booking.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Post()
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'PATIENT')
  create(@Body() dto: CreateBookingDto) {
    return this.booking.create(dto);
  }

  @Get()
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'DIRECTOR', 'AUDITOR')
  findAll() {
    return this.booking.findAll();
  }

  // ----- Portal Pasien -----
  @Post('me')
  @Roles('PATIENT', 'SUPER_ADMIN')
  createForPatient(@Body() dto: SelfBookingDto, @CurrentUser() user: { id: string }) {
    return this.booking.createForPatient(dto, user.id);
  }

  @Get('me')
  @Roles('PATIENT', 'SUPER_ADMIN')
  myBookings(@CurrentUser() user: { id: string }) {
    return this.booking.myBookings(user.id);
  }

  @Get('me/:id')
  @Roles('PATIENT', 'SUPER_ADMIN')
  myBooking(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.booking.myBooking(id, user.id);
  }

  @Patch('me/:id/cancel')
  @Roles('PATIENT', 'SUPER_ADMIN')
  cancelMine(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.booking.cancelMine(id, user.id);
  }

  @Patch(':id/assign')
  @Roles('COORDINATOR', 'SUPER_ADMIN')
  autoAssign(@Param('id') id: string) {
    return this.booking.autoAssign(id);
  }

  @Patch(':id/assign/:workerId')
  @Roles('COORDINATOR', 'SUPER_ADMIN')
  assignTo(@Param('id') id: string, @Param('workerId') workerId: string) {
    return this.booking.assignTo(id, workerId);
  }

  @Patch(':id/status/:status')
  @Roles('COORDINATOR', 'SUPER_ADMIN', 'HEALTH_WORKER')
  changeStatus(@Param('id') id: string, @Param('status') status: BookingStatus) {
    return this.booking.changeStatus(id, status);
  }

  // Ping lokasi nakes saat "Dalam Perjalanan" (dipanggil berkala dari perangkat nakes).
  @Patch(':id/location')
  @Roles('HEALTH_WORKER', 'COORDINATOR', 'SUPER_ADMIN')
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.booking.updateLocation(id, dto);
  }
}
