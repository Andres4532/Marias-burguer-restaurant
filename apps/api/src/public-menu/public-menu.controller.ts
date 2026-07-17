import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PublicMenuService } from './public-menu.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';

@Controller('public/menu')
export class PublicMenuController {
  constructor(private publicMenuService: PublicMenuService) {}

  @Get('branding')
  getBranding() {
    return this.publicMenuService.getPublicBranding();
  }

  @Get('link')
  getPublicLink() {
    return this.publicMenuService.getPublicLink();
  }

  @Get(':slug')
  getMenu(@Param('slug') slug: string) {
    return this.publicMenuService.getMenu(slug);
  }

  @Post(':slug/orders')
  createOrder(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicOrderDto,
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';
    return this.publicMenuService.createOrder(slug, dto, clientIp);
  }
}
