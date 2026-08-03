import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { createImageUploadOptions } from './uploads.config';
import { CloudinaryService } from './cloudinary.service';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.JEFA)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', createImageUploadOptions('products')),
  )
  async uploadProductImage(@UploadedFile() file?: Express.Multer.File) {
    return this.buildResponse('products', file);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', createImageUploadOptions('logos')))
  async uploadLogo(@UploadedFile() file?: Express.Multer.File) {
    return this.buildResponse('logos', file);
  }

  private async buildResponse(
    kind: 'products' | 'logos',
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    if (this.cloudinaryService.enabled) {
      if (!file.buffer?.length) {
        throw new BadRequestException('No se pudo leer la imagen');
      }
      const url = await this.cloudinaryService.uploadImage(file.buffer, kind);
      return { url };
    }

    return {
      url: this.uploadsService.buildFileUrl(kind, file.filename),
    };
  }
}
