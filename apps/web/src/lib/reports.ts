import { apiFetch } from './api-client';
import { getToken } from './auth';
import type { PaymentMethod } from '@/types/orders';

export interface SalesReport {
  from: string;
  to: string;
  date?: string;
  timezone: string;
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

export function getTodayInTz(timezone = TZ): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

export function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return formatYmd(date);
}

export function getMonthStart(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}-01`;
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatReportDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatReportPeriod(from: string, to: string): string {
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

export function buildReportSummary(
  report: SalesReport,
  formatPrice: (n: number) => string,
): string {
  const lines = [
    'REPORTE DE VENTAS — POS Restaurante',
    `Período: ${formatReportPeriod(report.from, report.to)}`,
    `Zona horaria: ${report.timezone}`,
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

  if (report.dailySeries.length > 1) {
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
