import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/utils/decimal.util';
import { TimezoneService } from '../common/timezone/timezone.service';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const MAX_RANGE_DAYS = 93;
const TOP_PRODUCTS_LIMIT = 10;

type ReportGranularity = 'day' | 'month';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private timezone: TimezoneService,
  ) {}

  async getDailyReport() {
    const { dateStr } = this.timezone.getTodayBounds();
    return this.getRangeReport(dateStr, dateStr);
  }

  async getYearReport(year: number) {
    const tz = this.timezone.getTimezone();
    const currentYear = Number(formatInTimeZone(new Date(), tz, 'yyyy'));

    if (year > currentYear) {
      throw new BadRequestException('No se pueden consultar años futuros');
    }

    const from = `${year}-01-01`;
    const { dateStr: today } = this.timezone.getTodayBounds();
    const to = year === currentYear ? today : `${year}-12-31`;

    return this.buildReport(from, to, 'month', year);
  }

  async getRangeReport(from: string, to: string) {
    if (from > to) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la final');
    }

    const dayCount = this.countDaysInclusive(from, to);
    if (dayCount > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `El rango máximo es de ${MAX_RANGE_DAYS} días. Usa el reporte anual para ver todo un año.`,
      );
    }

    return this.buildReport(from, to, 'day');
  }

  private async buildReport(
    from: string,
    to: string,
    granularity: ReportGranularity,
    year?: number,
  ) {
    const { start, end } = this.timezone.getRangeBounds(from, to);
    const tz = this.timezone.getTimezone();

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAGADO,
        paidAt: { gte: start, lte: end },
      },
      select: {
        method: true,
        amount: true,
        orderId: true,
        paidAt: true,
      },
    });

    const totalSales = payments.reduce(
      (sum, p) => sum + toNumber(p.amount),
      0,
    );

    const paidOrderIds = new Set(payments.map((p) => p.orderId));

    const ordersInRange = await this.prisma.order.count({
      where: { createdAt: { gte: start, lte: end } },
    });

    const byMethod = (
      [PaymentMethod.EFECTIVO, PaymentMethod.QR] as const
    ).map((method) => {
      const methodPayments = payments.filter((p) => p.method === method);
      return {
        method,
        total: methodPayments.reduce(
          (sum, p) => sum + toNumber(p.amount),
          0,
        ),
        count: methodPayments.length,
      };
    });

    const pendingOrders = await this.prisma.order.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'PENDIENTE',
      },
    });

    const periodFormat = granularity === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd';
    const periods =
      granularity === 'month'
        ? this.iterateMonths(from, to)
        : this.iterateDays(from, to);

    const salesByPeriod = new Map<
      string,
      { total: number; paidOrders: Set<string> }
    >();
    for (const period of periods) {
      salesByPeriod.set(period, { total: 0, paidOrders: new Set() });
    }

    for (const payment of payments) {
      const period = formatInTimeZone(payment.paidAt, tz, periodFormat);
      const entry = salesByPeriod.get(period);
      if (!entry) continue;
      entry.total += toNumber(payment.amount);
      entry.paidOrders.add(payment.orderId);
    }

    const series = Array.from(salesByPeriod.entries()).map(([date, data]) => ({
      date,
      total: Math.round(data.total * 100) / 100,
      paidOrderCount: data.paidOrders.size,
    }));

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          payments: {
            some: {
              status: PaymentStatus.PAGADO,
              paidAt: { gte: start, lte: end },
            },
          },
        },
      },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        lineTotal: true,
      },
    });

    const productMap = new Map<
      string,
      { productId: string; productName: string; quantity: number; total: number }
    >();

    for (const item of orderItems) {
      const existing = productMap.get(item.productId);
      const lineTotal = toNumber(item.lineTotal);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += lineTotal;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          total: lineTotal,
        });
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
      .slice(0, TOP_PRODUCTS_LIMIT)
      .map((p) => ({
        ...p,
        total: Math.round(p.total * 100) / 100,
      }));

    const isSingleDay = from === to && granularity === 'day';

    return {
      from,
      to,
      year,
      date: isSingleDay ? from : undefined,
      timezone: tz,
      granularity,
      totalSales: Math.round(totalSales * 100) / 100,
      paidOrderCount: paidOrderIds.size,
      orderCount: ordersInRange,
      pendingOrderCount: pendingOrders,
      byMethod,
      dailySeries: granularity === 'day' ? series : [],
      monthlySeries: granularity === 'month' ? series : [],
      topProducts,
    };
  }

  private countDaysInclusive(from: string, to: string): number {
    const start = parseISO(from);
    const end = parseISO(to);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }

  private iterateDays(from: string, to: string): string[] {
    const days: string[] = [];
    let current = from;
    while (current <= to) {
      days.push(current);
      const [y, m, d] = current.split('-').map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + 1));
      current = next.toISOString().slice(0, 10);
    }
    return days;
  }

  private iterateMonths(from: string, to: string): string[] {
    const months: string[] = [];
    let year = Number(from.slice(0, 4));
    let month = Number(from.slice(5, 7));
    const endYear = Number(to.slice(0, 4));
    const endMonth = Number(to.slice(5, 7));

    while (year < endYear || (year === endYear && month <= endMonth)) {
      months.push(`${year}-${String(month).padStart(2, '0')}`);
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return months;
  }
}
