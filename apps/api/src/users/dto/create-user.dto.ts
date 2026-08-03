import { IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { IsLoginIdentifier } from '../../common/validators/login-identifier';

export class CreateUserDto {
  @IsLoginIdentifier()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsEnum(UserRole)
  role: UserRole;
}
