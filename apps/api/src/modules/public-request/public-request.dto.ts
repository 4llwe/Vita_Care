import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
export class CreatePublicRequestDto {
  @IsIn(["SERVICE", "BOOKING", "PARTNERSHIP", "CONTACT", "COMPLAINT", "DOWNLOAD_SUPPORT"])
  type!: string;
  @IsString() @MinLength(2) @MaxLength(80) section!: string;
  @IsString() @MinLength(2) @MaxLength(120) slug!: string;
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsString() @MinLength(10) @MaxLength(2000) message!: string;
  @IsOptional() @IsDateString() preferredAt?: string;
}
export class UpdatePublicRequestDto {
  @IsIn(["NEW", "CONTACTED", "SCHEDULED", "RESOLVED", "REJECTED"]) status!: string;
  @IsOptional() @IsString() @MaxLength(2000) resolution?: string;
}
