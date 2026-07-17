'use client';

import { formatPrice } from '@/lib/catalog';
import { formatReportDate } from '@/lib/reports';
import type { SalesReport } from '@/lib/reports';

interface SalesChartProps {
  series: SalesReport['dailySeries'];
}

export function SalesChart({ series }: SalesChartProps) {
  if (series.length === 0) {
    return <p className="text-sm text-text-secondary">Sin datos para graficar.</p>;
  }

  const maxTotal = Math.max(...series.map((d) => d.total), 1);
  const showLabels = series.length <= 14;

  return (
    <div className="space-y-3">
      <div
        className="flex items-end gap-2 h-48"
        role="img"
        aria-label="Gráfico de ventas por día"
      >
        {series.map((day) => {
          const heightPct = Math.max(
            (day.total / maxTotal) * 100,
            day.total > 0 ? 6 : 0,
          );
          return (
            <div
              key={day.date}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group"
              title={`${formatReportDate(day.date)}: ${formatPrice(day.total)}`}
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
          {series.map((day) => (
            <div key={day.date} className="flex-1 min-w-0 text-center">
              <span className="text-[10px] font-bold text-text-secondary block truncate">
                {day.date.slice(8)}/{day.date.slice(5, 7)}
              </span>
            </div>
          ))}
        </div>
      )}
      {!showLabels && (
        <p className="text-xs text-text-secondary text-center font-medium">
          {formatReportDate(series[0].date)} —{' '}
          {formatReportDate(series[series.length - 1].date)}
        </p>
      )}
    </div>
  );
}
