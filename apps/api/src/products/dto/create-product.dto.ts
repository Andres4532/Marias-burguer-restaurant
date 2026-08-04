import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsInt,
  IsArray,
  IsUrl,
  MaxLength,
  ValidateIf,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ProductPromoType } from '@prisma/client';
import { HTTP_URL_VALIDATION_OPTIONS } from '../../common/validation/url-options';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, { message: 'URL de imagen inválida' })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraIds?: string[];

  @IsOptional()
  @IsEnum(ProductPromoType)
  promoType?: ProductPromoType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  promoValue?: number;

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsDateString()
  promoStartsAt?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsDateString()
  promoEndsAt?: string | null;
}
