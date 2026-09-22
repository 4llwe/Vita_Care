import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistCategory } from '@prisma/client';

export class ChecklistItemDto {
  @IsString()
  @MinLength(3)
  question!: string;

  @IsOptional()
  @IsString()
  guidance?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  weight?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateChecklistDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsEnum(ChecklistCategory)
  category!: ChecklistCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items!: ChecklistItemDto[];
}
