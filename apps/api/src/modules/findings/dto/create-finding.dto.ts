import {
  IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength, IsISO8601,
} from 'class-validator';
import { FindingCategory } from '@prisma/client';

export class CreateFindingDto {
  @IsString()
  @MinLength(10, { message: 'Deskripsi temuan minimal 10 karakter' })
  description!: string;

  @IsEnum(FindingCategory)
  category!: FindingCategory;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsInt() @Min(1) @Max(5)
  probability!: number;

  @IsInt() @Min(1) @Max(5)
  impact!: number;

  @IsOptional()
  @IsString()
  picId?: string;

  @IsOptional()
  @IsISO8601()
  deadline?: string;
}
