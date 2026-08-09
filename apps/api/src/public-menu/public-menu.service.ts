import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { SettingsService } from '../settings/settings.service';
import { OrdersService } from '../orders/orders.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { InMemoryRateLimitService } from '../common/rate-limit/in-memory-rate-limit.service';

@Injectable()
export class PublicMenuService {
  private readonly maxOrders = 5;
  private readonly windowMs = 10 * 60 * 1000;
  private readonly maxProofUploads = 10;
  private readonly proofWindowMs = 10 * 60 * 1000;

  constructor(
    private settingsService: SettingsService,
    private catalogService: CatalogService,
    private ordersService: OrdersService,
    private rateLimit: InMemoryRateLimitService,
  ) {}

  async getPublicLink() {
    const settings = await this.settingsService.getSettings();
    if (!settings.publicMenuEnabled) {
      throw new NotFoundException('Menú no disponible');
    }
    return {
      name: settings.name,
      slug: settings.slug,
      logoUrl: settings.logoUrl,
      publicMenuEnabled: settings.publicMenuEnabled,
    };
  }

  async getPublicBranding() {
    return this.settingsService.getPublicBranding();
  }

  async getMenu(slug: string) {
    const settings = await this.assertMenuAvailable(slug);

    const catalog = await this.catalogService.getCatalog();

    return {
      restaurant: {
        name: settings.name,
        slug: settings.slug,
        phone: settings.phone,
        logoUrl: settings.logoUrl,
        qrImageUrl: settings.qrImageUrl,
        openTime: settings.publicMenuOpenTime,
        closeTime: settings.publicMenuCloseTime,
      },
      categories: catalog.categories,
    };
  }

  assertProofUploadRateLimit(clientIp: string) {
    this.rateLimit.assertWithinLimit(
      `public-proof:${clientIp}`,
      this.maxProofUploads,
      this.proofWindowMs,
      'Demasiadas subidas. Intenta de nuevo en unos minutos.',
    );
  }

  async assertMenuAvailable(slug: string) {
    const settings = await this.settingsService.getBySlug(slug);

    if (!settings) {
      throw new NotFoundException('Menú no disponible');
    }

    const closedMessage = this.settingsService.getMenuAvailabilityMessage(settings);
    if (closedMessage) {
      throw new NotFoundException(closedMessage);
    }

    return settings;
  }

  async createOrder(slug: string, dto: CreatePublicOrderDto, clientIp: string) {
    await this.assertMenuAvailable(slug);

    this.rateLimit.assertWithinLimit(
      `public-order:${clientIp}`,
      this.maxOrders,
      this.windowMs,
      'Demasiados pedidos. Intenta de nuevo en unos minutos.',
    );

    return this.ordersService.createFromPublicMenu(dto);
  }

  trackOrder(token: string) {
    return this.ordersService.getPublicOrderTracking(token);
  }
}
