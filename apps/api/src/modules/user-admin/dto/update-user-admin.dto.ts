import { Role } from '@prisma/client';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional() @IsEnum(Role)
  role?: Role;

  @IsOptional() @IsArray() @ArrayUnique() @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
