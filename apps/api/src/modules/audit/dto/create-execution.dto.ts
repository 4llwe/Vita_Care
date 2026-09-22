import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  checklistId!: string;

  @IsString()
  @MinLength(2)
  auditeeUnit!: string;

  @IsOptional()
  @IsString()
  zone?: string;
}
