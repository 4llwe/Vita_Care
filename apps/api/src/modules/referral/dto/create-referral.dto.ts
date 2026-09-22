import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReferralUrgency } from '@prisma/client';

export class CreateReferralDto {
  @IsString()
  @MinLength(2)
  patientName!: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsString()
  @MinLength(2)
  toHospital!: string;

  @IsString()
  @MinLength(5, { message: 'Alasan rujukan minimal 5 karakter' })
  reason!: string;

  @IsOptional()
  @IsEnum(ReferralUrgency)
  urgency?: ReferralUrgency;
}
