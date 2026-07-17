import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(AuthGuard('jwt'))
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get()
  getCatalog() {
    return this.catalogService.getCatalog();
  }
}
