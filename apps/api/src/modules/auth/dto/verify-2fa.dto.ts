import { IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsString()
  tmpToken!: string;

  @IsString()
  @Length(6, 6, { message: 'Kode OTP harus 6 digit' })
  otp!: string;
}
