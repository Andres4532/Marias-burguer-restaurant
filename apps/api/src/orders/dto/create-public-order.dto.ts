import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MinLength,
  IsEnum,
  ValidateIf,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod } from '@prisma/client';
import { CreateOrderItemDto } from './create-order.dto';
import { HTTP_URL_VALIDATION_OPTIONS } from '../../common/validation/url-options';

export class CreatePublicOrderDto {
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  customerName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  customerPhone: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  deliveryAddress?: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsOptional()
  @IsString()
  deliveryReference?: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude?: number;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.QR)
  @IsString()
  @IsNotEmpty()
  @IsUrl(HTTP_URL_VALIDATION_OPTIONS, { message: 'URL del comprobante inválida' })
  paymentProofUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
