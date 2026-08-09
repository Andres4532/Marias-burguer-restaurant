import { apiFetch } from './api-client';
import { getToken } from './auth';
import type { PaymentMethod } from '@/types/orders';

export interface SalesReport {
  from: string;
  to: string;
  year?: number;
  date?: string;
  timezone: string;
  granularity?: 'day' | 'month';
  totalSales: number;
  paidOrderCount: number;
  orderCount: number;
  pendingOrderCount: number;
  byMethod: Array<{
    method: PaymentMethod;
    total: number;
    count: number;
  }>;
  dailySeries: Array<{
    date: string;
    total: number;
    paidOrderCount: number;
  }>;
  monthlySeries?: Array<{
    date: string;
    total: number;
    paidOrderCount: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    total: number;
  }>;
}

/** @deprecated Use SalesReport */
export type DailyReport = SalesReport;

const TZ = 'America/La_Paz';

function dateFromYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function formatYmdUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekdayInTz(date: Date): number {
  const weekday = date.toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
  });
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export function getTodayInTz(timezone = TZ): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = getWeekdayInTz(anchor);
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(Date.UTC(y, m - 1, d - diff, 12, 0, 0));
  return formatYmdUtc(start);
}

export function getMonthStart(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}-01`;
}

export function getCurrentYear(dateStr = getTodayInTz()): number {
  return Number(dateStr.slice(0, 4));
}

export function formatReportMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)).toLocaleDateString(
    'es-BO',
    { timeZone: TZ, month: 'short', year: 'numeric' },
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatReportYear(year: number): string {
  return String(year);
}

export function formatReportDate(dateStr: string): string {
  return dateFromYmd(dateStr).toLocaleDateString('es-BO', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatReportDateTime(date = new Date()): string {
  return date.toLocaleString('es-BO', { timeZone: TZ });
}

export function formatReportPeriod(from: string, to: string, year?: number): string {
  if (year != null) return `Año ${year}`;
  if (from === to) return formatReportDate(from);
  return `${formatReportDate(from)} — ${formatReportDate(to)}`;
}

export const getDailyReport = () =>
  apiFetch<SalesReport>('/reports/daily', {}, getToken());

export const getRangeReport = (from: string, to: string) =>
  apiFetch<SalesReport>(
    `/reports/range?from=${from}&to=${to}`,
    {},
    getToken(),
  );

export const getYearReport = (year: number) =>
  apiFetch<SalesReport>(`/reports/year?year=${year}`, {}, getToken());

export function buildReportSummary(
  report: SalesReport,
  formatPrice: (n: number) => string,
): string {
  const lines = [
    'REPORTE DE VENTAS — POS Restaurante',
    `Período: ${formatReportPeriod(report.from, report.to, report.year)}`,
    '',
    `Total vendido: ${formatPrice(report.totalSales)}`,
    `Pedidos cobrados: ${report.paidOrderCount}`,
    `Pedidos creados: ${report.orderCount}`,
    `Pendientes de cobro: ${report.pendingOrderCount}`,
    '',
    'Por método de pago:',
    ...report.byMethod.map(
      (m) =>
        `- ${m.method}: ${formatPrice(m.total)} (${m.count} cobro${m.count !== 1 ? 's' : ''})`,
    ),
  ];

  const monthSeries = report.monthlySeries ?? [];
  if (monthSeries.length > 0) {
    lines.push('', 'Ventas por mes:');
    for (const month of monthSeries) {
      lines.push(
        `- ${formatReportMonth(month.date)}: ${formatPrice(month.total)} (${month.paidOrderCount} pedido${month.paidOrderCount !== 1 ? 's' : ''})`,
      );
    }
  } else if (report.dailySeries.length > 1) {
    lines.push('', 'Ventas por día:');
    for (const day of report.dailySeries) {
      lines.push(
        `- ${formatReportDate(day.date)}: ${formatPrice(day.total)} (${day.paidOrderCount} pedido${day.paidOrderCount !== 1 ? 's' : ''})`,
      );
    }
  }

  if (report.topProducts.length > 0) {
    lines.push('', 'Top productos:');
    report.topProducts.forEach((p, i) => {
      lines.push(
        `${i + 1}. ${p.productName} — ${p.quantity} uds — ${formatPrice(p.total)}`,
      );
    });
  }

  return lines.join('\n');
}
