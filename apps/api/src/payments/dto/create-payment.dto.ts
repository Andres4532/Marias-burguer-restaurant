import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

const ALLOWED_PAYMENT_METHODS = [
  PaymentMethod.EFECTIVO,
  PaymentMethod.QR,
] as const;

export class CreatePaymentDto {
  @IsIn(ALLOWED_PAYMENT_METHODS, {
    message: 'Método de pago no disponible. Use Efectivo o QR.',
  })
  method: PaymentMethod;

  @ValidateIf((o) => o.method === PaymentMethod.EFECTIVO)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amountReceived?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingNit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingBusinessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingComplement?: string;
}
