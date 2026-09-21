import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  category!: string; // SOP | Kebijakan | Formulir | Sertifikat | Panduan

  @IsOptional()
  @IsString()
  ownerId?: string;
}

export class NewVersionDto {
  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  changeNote?: string;

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class ReviewDto {
  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
