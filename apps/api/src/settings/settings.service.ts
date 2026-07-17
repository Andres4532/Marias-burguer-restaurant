import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import { PrismaService } from '../prisma/prisma.service';
import { TimezoneService } from '../common/timezone/timezone.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SETTINGS_ID = 'default';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private timezone: TimezoneService,
  ) {}

  private mapSettings(settings: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    logoUrl: string | null;
    publicMenuEnabled: boolean;
    publicMenuOpenTime: string | null;
    publicMenuCloseTime: string | null;
    updatedAt: Date;
  }) {
    return {
      id: settings.id,
      name: settings.name,
      slug: settings.slug,
      phone: settings.phone,
      logoUrl: settings.logoUrl,
      publicMenuEnabled: settings.publicMenuEnabled,
      publicMenuOpenTime: settings.publicMenuOpenTime,
      publicMenuCloseTime: settings.publicMenuCloseTime,
      updatedAt: settings.updatedAt,
    };
  }

  isMenuOpenNow(settings: {
    publicMenuEnabled: boolean;
    publicMenuOpenTime: string | null;
    publicMenuCloseTime: string | null;
  }): boolean {
    if (!settings.publicMenuEnabled) return false;

    const open = settings.publicMenuOpenTime;
    const close = settings.publicMenuCloseTime;
    if (!open || !close) return true;

    const now = formatInTimeZone(
      new Date(),
      this.timezone.getTimezone(),
      'HH:mm',
    );

    if (open <= close) {
      return now >= open && now <= close;
    }

    return now >= open || now <= close;
  }

  getMenuAvailabilityMessage(settings: {
    publicMenuEnabled: boolean;
    publicMenuOpenTime: string | null;
    publicMenuCloseTime: string | null;
  }): string | null {
    if (!settings.publicMenuEnabled) {
      return 'El menú público está desactivado';
    }
    if (this.isMenuOpenNow(settings)) return null;
    const open = settings.publicMenuOpenTime ?? '08:00';
    const close = settings.publicMenuCloseTime ?? '22:00';
    return `El menú público atiende de ${open} a ${close}`;
  }

  async getSettings() {
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      throw new NotFoundException('Configuración no encontrada');
    }

    return this.mapSettings(settings);
  }

  async getPublicBranding() {
    const settings = await this.getSettings();
    return {
      name: settings.name,
      logoUrl: settings.logoUrl,
    };
  }

  async getBySlug(slug: string) {
    return this.prisma.restaurantSettings.findUnique({
      where: { slug },
    });
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.getSettings();

    if (dto.slug && dto.slug !== current.slug) {
      const existing = await this.prisma.restaurantSettings.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Ese slug ya está en uso');
      }
    }

    const openTime = dto.publicMenuOpenTime ?? current.publicMenuOpenTime;
    const closeTime = dto.publicMenuCloseTime ?? current.publicMenuCloseTime;
    if (openTime && closeTime && openTime === closeTime) {
      throw new BadRequestException(
        'La hora de apertura y cierre no pueden ser iguales',
      );
    }

    const updated = await this.prisma.restaurantSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        name: dto.name,
        slug: dto.slug,
        phone: dto.phone,
        logoUrl: dto.logoUrl === '' ? null : dto.logoUrl,
        publicMenuEnabled: dto.publicMenuEnabled,
        publicMenuOpenTime: dto.publicMenuOpenTime,
        publicMenuCloseTime: dto.publicMenuCloseTime,
      },
    });

    return this.mapSettings(updated);
  }
}
