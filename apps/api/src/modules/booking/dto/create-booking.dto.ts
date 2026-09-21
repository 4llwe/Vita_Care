import { IsISO8601, IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  patientName!: string;

  @IsString()
  serviceId!: string;

  @IsString()
  zone!: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsISO8601()
  scheduledAt!: string;
}
