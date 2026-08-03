import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IsLoginIdentifier } from '../../common/validators/login-identifier';

export class LoginDto {
  @IsLoginIdentifier()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
