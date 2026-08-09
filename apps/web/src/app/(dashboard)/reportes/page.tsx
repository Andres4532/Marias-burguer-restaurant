'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { SalesChart } from '@/components/reports/SalesChart';
import {
  getCurrentYear,
  getRangeReport,
  getTodayInTz,
  getWeekStart,
  getMonthStart,
  getYearReport,
  formatReportPeriod,
  buildReportSummary,
  type SalesReport,
} from '@/lib/reports';
import { downloadReportPdf } from '@/lib/export-report-pdf';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import { PAYMENT_METHOD_LABELS } from '@/types/orders';

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom';

const PRESETS: Array<{ key: Preset; label: string }> = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'year', label: 'Este año' },
  { key: 'custom', label: 'Personalizado' },
];

const FIRST_REPORT_YEAR = 2024;

export default function ReportesPage() {
  const { loading, isJefa } = useRequireJefa();
  const today = getTodayInTz();
  const currentYear = getCurrentYear(today);
  const [preset, setPreset] = useState<Preset>('today');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [error, setError] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = currentYear; year >= FIRST_REPORT_YEAR; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const applyPreset = useCallback(
    (p: Preset) => {
      const t = getTodayInTz();
      setPreset(p);
      if (p === 'today') {
        setFrom(t);
        setTo(t);
      } else if (p === 'week') {
        setFrom(getWeekStart(t));
        setTo(t);
      } else if (p === 'month') {
        setFrom(getMonthStart(t));
        setTo(t);
      } else if (p === 'year') {
        setSelectedYear(getCurrentYear(t));
      }
    },
    [],
  );

  const load = useCallback(async () => {
    setLoadingReport(true);
    setError('');
    try {
      if (preset === 'year') {
        setReport(await getYearReport(selectedYear));
      } else {
        setReport(await getRangeReport(from, to));
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingReport(false);
    }
  }, [from, to, preset, selectedYear]);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(
        buildReportSummary(report, formatPrice),
      );
      setCopyMsg('Resumen copiado al portapapeles');
      setTimeout(() => setCopyMsg(''), 2500);
    } catch {
      setError('No se pudo copiar el resumen');
    }
  };

  const handleExport = () => {
    if (!report) return;
    void downloadReportPdf(report, formatPrice, PAYMENT_METHOD_LABELS);
  };

  const chartSeries =
    report?.granularity === 'month'
      ? (report.monthlySeries ?? [])
      : (report?.dailySeries ?? []);

  if (loading || !isJefa) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reportes de ventas"
        description={
          report
            ? formatReportPeriod(report.from, report.to, report.year)
            : 'Análisis por período'
        }
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={handleCopy} disabled={!report}>
              Copiar
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={!report}>
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={load} disabled={loadingReport}>
              {loadingReport ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        }
      />

      <Card padding="md" className="mb-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(({ key, label }) => (
            <FilterChip
              key={key}
              active={preset === key}
              onClick={() => applyPreset(key)}
            >
              {label}
            </FilterChip>
          ))}
        </div>

        {preset === 'year' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">
                Año
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                    {year === currentYear ? ' (en curso)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <Button onClick={load} disabled={loadingReport}>
              Aplicar
            </Button>
          </div>
        )}

        {preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <Input
              label="Desde"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input
              label="Hasta"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Button onClick={load} disabled={loadingReport}>
              Aplicar
            </Button>
          </div>
        )}
      </Card>

      {copyMsg && (
        <p className="text-sm text-green-300 bg-green-950/40 border border-green-800/50 px-4 py-2 rounded-xl mb-4 font-medium">
          {copyMsg}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-4 py-3 rounded-xl mb-4 font-medium">
          {error}
        </p>
      )}

      {loadingReport && !report ? (
        <p className="text-text-secondary font-medium">Cargando reporte...</p>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Total vendido"
              value={formatPrice(report.totalSales)}
              highlight
            />
            <StatCard
              label="Pedidos cobrados"
              value={String(report.paidOrderCount)}
            />
            <StatCard
              label="Pedidos creados"
              value={String(report.orderCount)}
            />
            <StatCard
              label="Pendientes de cobro"
              value={String(report.pendingOrderCount)}
              warning={report.pendingOrderCount > 0}
            />
          </div>

          {chartSeries.length > 0 && (
            <Card padding="lg">
              <h3 className="text-lg font-extrabold text-foreground mb-1">
                {report.granularity === 'month'
                  ? 'Ventas por mes'
                  : 'Ventas por día'}
              </h3>
              <p className="text-sm text-text-secondary mb-5">
                {report.granularity === 'month'
                  ? 'Resumen mensual del año seleccionado'
                  : 'Resumen visual del período seleccionado'}
              </p>
              <SalesChart
                series={chartSeries}
                granularity={report.granularity ?? 'day'}
              />
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card padding="lg">
              <h3 className="text-lg font-extrabold text-foreground mb-4">
                Métodos de pago
              </h3>

              {report.totalSales === 0 ? (
                <p className="text-sm text-text-secondary">
                  No hay ventas cobradas en este período.
                </p>
              ) : (
                <div className="space-y-4">
                  {report.byMethod.map((item) => {
                    const pct =
                      report.totalSales > 0
                        ? Math.round((item.total / report.totalSales) * 100)
                        : 0;
                    return (
                      <div key={item.method}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {item.method === 'EFECTIVO'
                              ? '💵'
                              : item.method === 'QR'
                                ? '📱'
                                : '💳'}{' '}
                            {PAYMENT_METHOD_LABELS[item.method]}
                            <span className="text-text-secondary font-medium ml-1">
                              ({item.count} cobro{item.count !== 1 ? 's' : ''})
                            </span>
                          </span>
                          <span className="text-sm font-extrabold text-foreground">
                            {formatPrice(item.total)}
                          </span>
                        </div>
                        <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card padding="lg">
              <h3 className="text-lg font-extrabold text-foreground mb-4">
                Top productos vendidos
              </h3>

              {report.topProducts.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Sin productos vendidos en este período.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between rounded-xl bg-background border border-border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-extrabold">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {product.productName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {product.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <p className="font-extrabold text-foreground shrink-0 ml-3">
                        {formatPrice(product.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <Card
      padding="md"
      className={
        highlight
          ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
          : warning
            ? 'bg-yellow-50 border-yellow-200'
            : ''
      }
    >
      <p
        className={`text-sm font-bold ${
          highlight
            ? 'text-white/80'
            : warning
              ? 'text-yellow-700'
              : 'text-text-secondary'
        }`}
      >
        {label}
      </p>
      <p
        className={`text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight ${
          highlight
            ? 'text-white'
            : warning
              ? 'text-yellow-800'
              : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
