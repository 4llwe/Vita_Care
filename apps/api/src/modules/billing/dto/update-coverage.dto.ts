import { ClaimStatus, PayerType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCoverageDto {
  @IsEnum(PayerType)
  payerType!: PayerType;

  @IsOptional() @IsString() @MaxLength(160)
  insurerName?: string;

  @IsOptional() @IsString() @MaxLength(100)
  memberNumber?: string;

  @IsOptional() @IsString() @MaxLength(100)
  claimNumber?: string;

  @IsEnum(ClaimStatus)
  claimStatus!: ClaimStatus;

  @IsInt() @Min(0)
  coveredAmount!: number;
}
