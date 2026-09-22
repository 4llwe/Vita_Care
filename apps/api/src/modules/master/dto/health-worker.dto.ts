import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateHealthWorkerDto {
  @IsOptional() @IsString() userId?: string;
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  profession!: string; // Dokter | Perawat | Fisioterapis | Analis | Bidan

  @IsString()
  licenseNo!: string;

  @IsISO8601()
  licenseValidUntil!: string;

  @IsString()
  zone!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHealthWorkerDto {
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() licenseNo?: string;
  @IsOptional() @IsISO8601() licenseValidUntil?: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
