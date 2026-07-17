import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    const timestamp = new Date().toISOString();
    const base = {
      service: 'restaurante-pos-api',
      timestamp,
      timezone: process.env.RESTAURANT_TIMEZONE ?? 'America/La_Paz',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok', ...base };
    } catch {
      return { status: 'degraded', database: 'error', ...base };
    }
  }
}
