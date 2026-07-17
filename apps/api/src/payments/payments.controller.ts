import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post(':id/payments')
  pay(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.paymentsService.payOrder(id, dto, user.id);
  }
}
