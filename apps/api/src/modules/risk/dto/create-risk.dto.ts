import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateRiskDto {
  @IsString()
  @MinLength(5, { message: 'Judul risiko minimal 5 karakter' })
  title!: string;

  @IsString()
  category!: string; // Klinis | Operasional | Kepatuhan | Keuangan | SDM | Reputasi

  @IsInt() @Min(1) @Max(5)
  probability!: number;

  @IsInt() @Min(1) @Max(5)
  impact!: number;

  @IsOptional()
  @IsString()
  mitigation?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}
