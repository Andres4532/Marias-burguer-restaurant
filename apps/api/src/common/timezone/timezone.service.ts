import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class TimezoneService {
  private readonly timezone: string;

  constructor(configService: ConfigService) {
    this.timezone =
      configService.get<string>('RESTAURANT_TIMEZONE') ?? 'America/La_Paz';
  }

  getTimezone(): string {
    return this.timezone;
  }

  /** Inicio y fin del día calendario en la zona del restaurante (como UTC Date). */
  getTodayBounds(reference = new Date()) {
    const dateStr = formatInTimeZone(reference, this.timezone, 'yyyy-MM-dd');
    return this.getDateBounds(dateStr);
  }

  getDateBounds(dateStr: string) {
    const start = fromZonedTime(`${dateStr} 00:00:00.000`, this.timezone);
    const end = fromZonedTime(`${dateStr} 23:59:59.999`, this.timezone);
    return { start, end, dateStr };
  }

  getRangeBounds(fromStr: string, toStr: string) {
    const { start } = this.getDateBounds(fromStr);
    const { end } = this.getDateBounds(toStr);
    return { start, end, from: fromStr, to: toStr };
  }

  /** Fecha calendario (Date @db.Date) para contadores diarios. */
  getTodayDate(reference = new Date()): Date {
    const { dateStr } = this.getTodayBounds(reference);
    return fromZonedTime(`${dateStr} 00:00:00.000`, this.timezone);
  }
}
