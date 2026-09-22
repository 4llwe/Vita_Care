import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
export class PresignDto {
  @IsString() @MinLength(1) filename!: string;
  @IsString()
  @IsIn([
    "image/jpeg",
    "image/png",
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ])
  contentType!: string;
  @IsOptional()
  @IsIn(["documents", "capa-evidence", "audit-evidence", "clinical"])
  folder?: string;
  @IsInt() @Min(1) @Max(20 * 1024 * 1024) sizeBytes!: number;
}
