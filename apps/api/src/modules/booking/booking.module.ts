import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { GeoService } from './geo.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, GeoService, PrismaService],
  exports: [BookingService],
})
export class BookingModule {}
