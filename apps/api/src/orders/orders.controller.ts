import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderStatus, OrderSource, OrderType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateMesaOrderDto } from './dto/update-mesa-order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.ordersService.create(dto, user.id);
  }

  @Get()
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('source') source?: OrderSource,
    @Query('type') type?: OrderType,
    @Query('today') today?: string,
    @Query('unpaid') unpaid?: string,
  ) {
    return this.ordersService.findAll(
      status,
      today !== 'false',
      source,
      type,
      unpaid === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user);
  }

  @Patch(':id')
  updateMesaOrder(
    @Param('id') id: string,
    @Body() dto: UpdateMesaOrderDto,
  ) {
    return this.ordersService.updateMesaOrder(id, dto);
  }

  @Post(':id/confirm')
  confirmPublicOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.ordersService.confirmPublicOrder(id, user.id);
  }
}
