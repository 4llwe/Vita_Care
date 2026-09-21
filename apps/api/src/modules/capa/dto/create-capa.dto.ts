import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCapaDto {
  @IsString()
  findingId!: string;

  @IsString()
  @MinLength(10, { message: 'Rencana tindakan minimal 10 karakter' })
  actionPlan!: string;

  @IsISO8601()
  targetDate!: string;

  @IsOptional()
  @IsString()
  picId?: string;
}
