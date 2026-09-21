import { IsISO8601, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

/** Pemesanan mandiri oleh pasien: identitas diambil dari akun login. */
export class SelfBookingDto {
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
