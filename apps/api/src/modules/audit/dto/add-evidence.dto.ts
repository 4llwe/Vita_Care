import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class AddEvidenceDto {
  @IsString()
  @MinLength(4)
  fileUrl!: string;

  @IsOptional()
  @IsString()
  answerId?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  capturedAt?: string;
}
