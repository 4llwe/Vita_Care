import { IsLatitude, IsLongitude, IsNumber, IsOptional } from 'class-validator';

/** Ping lokasi nakes saat menuju pasien (status DALAM_PERJALANAN). */
export class UpdateLocationDto {
  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;
}
