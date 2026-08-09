import { Controller, Get, Post, Body, Param, Req, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { PublicMenuService } from './public-menu.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { getClientIp } from '../common/utils/client-ip.util';
import { createImageUploadOptions } from '../uploads/uploads.config';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { UploadsService } from '../uploads/uploads.service';

@Controller('public/menu')
export class PublicMenuController {
  constructor(
    private publicMenuService: PublicMenuService,
    private uploadsService: UploadsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get('branding')
  getBranding() {
    return this.publicMenuService.getPublicBranding();
  }

  @Get('link')
  getPublicLink() {
    return this.publicMenuService.getPublicLink();
  }

  @Get('track/:token')
  trackOrder(@Param('token') token: string) {
    return this.publicMenuService.trackOrder(token);
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
    const clientIp = getClientIp(req);
    return this.publicMenuService.createOrder(slug, dto, clientIp);
  }

  @Post(':slug/upload-proof')
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('proofs')),
  )
  async uploadPaymentProof(
    @Param('slug') slug: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    await this.publicMenuService.assertMenuAvailable(slug);
    this.publicMenuService.assertProofUploadRateLimit(getClientIp(req));

    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    if (this.cloudinaryService.enabled) {
      if (!file.buffer?.length) {
        throw new BadRequestException('No se pudo leer la imagen');
      }
      const url = await this.cloudinaryService.uploadImage(file.buffer, 'proofs');
      return { url };
    }

    return {
      url: this.uploadsService.buildFileUrl('proofs', file.filename),
    };
  }
}
