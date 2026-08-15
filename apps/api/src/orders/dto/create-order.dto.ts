import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
  ValidateIf,
  MinLength,
  IsNumber,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, SaucePlacement } from '@prisma/client';

export class CreateOrderItemSauceDto {
  @IsString()
  @IsNotEmpty()
  sauceId: string;

  @IsEnum(SaucePlacement)
  placement: SaucePlacement;
}

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemSauceDto)
  sauces?: CreateOrderItemSauceDto[];

  @IsOptional()
  @IsBoolean()
  noSauce?: boolean;

  @IsOptional()
  @IsBoolean()
  applyPromo?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @ValidateIf(
    (o) =>
      o.type === OrderType.MESA ||
      o.type === OrderType.PARA_LLEVAR ||
      o.type === OrderType.DELIVERY,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  customerName?: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  customerPhone?: string;

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
