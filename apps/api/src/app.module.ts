import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TimezoneModule } from './common/timezone/timezone.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ExtrasModule } from './extras/extras.module';
import { ProductsModule } from './products/products.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { PublicMenuModule } from './public-menu/public-menu.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    TimezoneModule,
    AuthModule,
    CategoriesModule,
    ExtrasModule,
    ProductsModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    ReportsModule,
    SettingsModule,
    PublicMenuModule,
    UsersModule,
    EventsModule,
    UploadsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
