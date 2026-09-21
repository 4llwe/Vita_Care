import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateTariffDto {
  @IsString()
  serviceId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdateTariffDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsInt() @Min(0) basePrice?: number;
  @IsOptional() @IsString() unit?: string;
}
