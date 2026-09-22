import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FindingCategory } from '@prisma/client';

/**
 * Payload untuk mengubah satu butir audit NON_COMPLIANT menjadi Temuan.
 * Deskripsi & root cause opsional: bila kosong, deskripsi dibentuk otomatis
 * dari pertanyaan butir + catatan auditor.
 */
export class CreateFindingFromAnswerDto {
  @IsEnum(FindingCategory)
  category!: FindingCategory;

  @IsInt() @Min(1) @Max(5)
  probability!: number;

  @IsInt() @Min(1) @Max(5)
  impact!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  picId?: string;

  @IsOptional()
  @IsISO8601()
  deadline?: string;
}
