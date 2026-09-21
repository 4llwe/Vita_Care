import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ComplianceResult } from '@prisma/client';

export class AnswerItemDto {
  @IsString()
  itemId!: string;

  @IsEnum(ComplianceResult)
  result!: ComplianceResult;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers!: AnswerItemDto[];
}
