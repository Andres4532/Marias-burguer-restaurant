import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { SettingsService } from '../settings/settings.service';
import { OrdersService } from '../orders/orders.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicMenuService {
  private rateLimits = new Map<string, RateLimitEntry>();
  private readonly maxOrders = 5;
  private readonly windowMs = 10 * 60 * 1000;

  constructor(
    private settingsService: SettingsService,
    private catalogService: CatalogService,
    private ordersService: OrdersService,
  ) {}

  private checkRateLimit(clientIp: string) {
    const now = Date.now();
    const entry = this.rateLimits.get(clientIp);

    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(clientIp, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    if (entry.count >= this.maxOrders) {
      throw new HttpException(
        'Demasiados pedidos. Intenta de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
  }

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
    const settings = await this.settingsService.getBySlug(slug);

    if (!settings) {
      throw new NotFoundException('Menú no disponible');
    }

    const closedMessage = this.settingsService.getMenuAvailabilityMessage(settings);
    if (closedMessage) {
      throw new NotFoundException(closedMessage);
    }

    const catalog = await this.catalogService.getCatalog();

    return {
      restaurant: {
        name: settings.name,
        slug: settings.slug,
        phone: settings.phone,
        logoUrl: settings.logoUrl,
        openTime: settings.publicMenuOpenTime,
        closeTime: settings.publicMenuCloseTime,
      },
      categories: catalog,
    };
  }

  async createOrder(slug: string, dto: CreatePublicOrderDto, clientIp: string) {
    const settings = await this.settingsService.getBySlug(slug);

    if (!settings) {
      throw new NotFoundException('Menú no disponible');
    }

    const closedMessage = this.settingsService.getMenuAvailabilityMessage(settings);
    if (closedMessage) {
      throw new NotFoundException(closedMessage);
    }

    this.checkRateLimit(clientIp);

    return this.ordersService.createFromPublicMenu(dto);
  }
}
