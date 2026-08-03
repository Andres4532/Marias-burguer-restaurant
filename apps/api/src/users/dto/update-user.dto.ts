import {
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsLoginIdentifier } from '../../common/validators/login-identifier';

export class UpdateUserDto {
  @IsOptional()
  @IsLoginIdentifier()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
