import {
  IsInt, IsNumber, IsOptional, IsString, MinLength, Max, Min, IsIn,
} from 'class-validator';

export class CreateRecordDto {
  @IsString()
  bookingId!: string;

  @IsString()
  @MinLength(2)
  patientName!: string;

  // SOAP
  @IsString() @MinLength(3)
  subjective!: string;

  @IsString() @MinLength(3)
  objective!: string;

  @IsString() @MinLength(3)
  assessment!: string;

  @IsString() @MinLength(3)
  plan!: string;

  // Vitals (opsional)
  @IsOptional() @IsInt() @Min(40) @Max(300) systolic?: number;
  @IsOptional() @IsInt() @Min(20) @Max(200) diastolic?: number;
  @IsOptional() @IsInt() @Min(20) @Max(250) heartRate?: number;
  @IsOptional() @IsInt() @Min(4)  @Max(60)  respRate?: number;
  @IsOptional() @IsNumber() @Min(30) @Max(45) temperature?: number;
  @IsOptional() @IsInt() @Min(50) @Max(100) spo2?: number;
  @IsOptional() @IsIn(['A', 'V', 'P', 'U']) consciousness?: string;
}
