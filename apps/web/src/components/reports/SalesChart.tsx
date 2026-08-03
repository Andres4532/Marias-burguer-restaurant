'use client';

import { formatPrice } from '@/lib/catalog';
import { formatReportDate, formatReportMonth } from '@/lib/reports';
import type { SalesReport } from '@/lib/reports';

type SeriesPoint = SalesReport['dailySeries'][number];

interface SalesChartProps {
  series: SeriesPoint[];
  granularity?: 'day' | 'month';
}

export function SalesChart({ series, granularity = 'day' }: SalesChartProps) {
  if (series.length === 0) {
    return <p className="text-sm text-text-secondary">Sin datos para graficar.</p>;
  }

  const maxTotal = Math.max(...series.map((d) => d.total), 1);
  const showLabels =
    granularity === 'month' ? series.length <= 12 : series.length <= 14;

  const formatLabel = (date: string) => {
    if (granularity === 'month') {
      const month = Number(date.slice(5, 7));
      return (
        new Date(2000, month - 1, 1).toLocaleDateString('es-BO', {
          month: 'short',
        }).slice(0, 3)
      );
    }
    return `${date.slice(8)}/${date.slice(5, 7)}`;
  };

  const formatTooltip = (point: SeriesPoint) =>
    granularity === 'month'
      ? `${formatReportMonth(point.date)}: ${formatPrice(point.total)}`
      : `${formatReportDate(point.date)}: ${formatPrice(point.total)}`;

  return (
    <div className="space-y-3">
      <div
        className="flex items-end gap-2 h-48"
        role="img"
        aria-label={
          granularity === 'month'
            ? 'Gráfico de ventas por mes'
            : 'Gráfico de ventas por día'
        }
      >
        {series.map((point) => {
          const heightPct = Math.max(
            (point.total / maxTotal) * 100,
            point.total > 0 ? 6 : 0,
          );
          return (
            <div
              key={point.date}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group"
              title={formatTooltip(point)}
            >
              <div
                className="w-full max-w-10 bg-primary rounded-t-xl transition-all group-hover:bg-primary-hover shadow-sm shadow-primary/10"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div className="flex gap-2">
          {series.map((point) => (
            <div key={point.date} className="flex-1 min-w-0 text-center">
              <span className="text-[10px] font-bold text-text-secondary block truncate">
                {formatLabel(point.date)}
              </span>
            </div>
          ))}
        </div>
      )}
      {!showLabels && (
        <p className="text-xs text-text-secondary text-center font-medium">
          {granularity === 'month'
            ? `${formatReportMonth(series[0].date)} — ${formatReportMonth(series[series.length - 1].date)}`
            : `${formatReportDate(series[0].date)} — ${formatReportDate(series[series.length - 1].date)}`}
        </p>
      )}
    </div>
  );
}
