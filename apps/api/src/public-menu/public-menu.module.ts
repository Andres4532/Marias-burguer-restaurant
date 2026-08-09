import { Module } from '@nestjs/common';
import { PublicMenuController } from './public-menu.controller';
import { PublicMenuService } from './public-menu.service';
import { CatalogModule } from '../catalog/catalog.module';
import { SettingsModule } from '../settings/settings.module';
import { OrdersModule } from '../orders/orders.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [CatalogModule, SettingsModule, OrdersModule, UploadsModule],
  controllers: [PublicMenuController],
  providers: [PublicMenuService],
})
export class PublicMenuModule {}
