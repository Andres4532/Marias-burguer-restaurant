import {
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  MinLength,
  MaxLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { HTTP_URL_VALIDATION_OPTIONS } from '../../common/validation/url-options';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede tener letras minúsculas, números y guiones',
  })
  @MinLength(3)
  @MaxLength(50)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, { message: 'URL del logo inválida' })
  @MaxLength(500)
  logoUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, { message: 'URL del QR inválida' })
  @MaxLength(500)
  qrImageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  publicMenuEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Hora de apertura inválida (HH:mm)' })
  publicMenuOpenTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Hora de cierre inválida (HH:mm)' })
  publicMenuCloseTime?: string;
}
