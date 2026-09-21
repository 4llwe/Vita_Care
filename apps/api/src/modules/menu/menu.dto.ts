import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
export class CreateMenuGroupDto {
  @IsString() @MinLength(2) @MaxLength(60) key!: string;
  @IsString() @MinLength(2) @MaxLength(80) label!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
}
export class UpdateMenuGroupDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) label?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
}
export class CreateMenuItemDto {
  @IsString() @MinLength(2) @MaxLength(120) label!: string;
  @IsString() @MinLength(2) @MaxLength(120) slug!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsIn(["secure", "request", "contact", "complaint", "partnership", "information"])
  operationKind!: string;
  @IsOptional()
  @IsIn(["SERVICE", "BOOKING", "PARTNERSHIP", "CONTACT", "COMPLAINT", "DOWNLOAD_SUPPORT"])
  requestType?: string;
  @IsOptional() @IsString() @MaxLength(160) headline?: string;
  @IsOptional() @IsArray() steps?: string[];
  @IsOptional() @IsString() @MaxLength(200) sla?: string;
  @IsOptional() @IsString() @MaxLength(500) hrefOverride?: string;
  @IsOptional() @IsInt() @Min(0) @Max(999) sortOrder?: number;
}
export class UpdateMenuItemDto extends CreateMenuItemDto {
  @IsOptional() label!: string;
  @IsOptional() slug!: string;
  @IsOptional() operationKind!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
