import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
