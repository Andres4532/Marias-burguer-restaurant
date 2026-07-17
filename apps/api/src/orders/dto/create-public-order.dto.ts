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
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@prisma/client';
import { CreateOrderItemDto } from './create-order.dto';

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
