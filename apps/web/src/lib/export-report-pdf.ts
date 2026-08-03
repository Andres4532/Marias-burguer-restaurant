import type { SalesReport } from './reports';
import {
  formatReportDate,
  formatReportMonth,
  formatReportPeriod,
} from './reports';

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;

type PdfDoc = InstanceType<(typeof import('jspdf'))['jsPDF']>;

function ensureSpace(doc: PdfDoc, y: number, needed = LINE_HEIGHT): number {
  if (y + needed > 285) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function writeLine(
  doc: PdfDoc,
  text: string,
  y: number,
  options?: { size?: number; bold?: boolean; color?: [number, number, number] },
): number {
  const size = options?.size ?? 10;
  y = ensureSpace(doc, y, LINE_HEIGHT + (size > 10 ? 2 : 0));
  doc.setFontSize(size);
  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
  if (options?.color) {
    doc.setTextColor(...options.color);
  } else {
    doc.setTextColor(40, 40, 40);
  }

  const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
  doc.text(lines, MARGIN, y);
  return y + lines.length * (size > 12 ? 8 : LINE_HEIGHT);
}

export async function downloadReportPdf(
  report: SalesReport,
  formatPrice: (n: number) => string,
  paymentLabels: Record<string, string>,
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;

  y = writeLine(doc, 'REPORTE DE VENTAS', y, {
    size: 16,
    bold: true,
    color: [249, 115, 22],
  });
  y = writeLine(doc, 'POS Restaurante', y, { size: 10, color: [100, 100, 100] });
  y += 2;

  y = writeLine(doc, `Periodo: ${formatReportPeriod(report.from, report.to, report.year)}`, y, {
    bold: true,
  });
  y = writeLine(doc, `Zona horaria: ${report.timezone}`, y);
  y = writeLine(
    doc,
    `Generado: ${new Date().toLocaleString('es-BO')}`,
    y,
    { color: [120, 120, 120] },
  );
  y += 4;

  y = writeLine(doc, 'RESUMEN', y, { size: 12, bold: true });
  y = writeLine(doc, `Total vendido: ${formatPrice(report.totalSales)}`, y, {
    bold: true,
  });
  y = writeLine(doc, `Pedidos cobrados: ${report.paidOrderCount}`, y);
  y = writeLine(doc, `Pedidos creados: ${report.orderCount}`, y);
  y = writeLine(doc, `Pendientes de cobro: ${report.pendingOrderCount}`, y);
  y += 4;

  if (report.byMethod.length > 0) {
    y = writeLine(doc, 'METODOS DE PAGO', y, { size: 12, bold: true });
    for (const item of report.byMethod) {
      const label = paymentLabels[item.method] ?? item.method;
      y = writeLine(
        doc,
        `- ${label}: ${formatPrice(item.total)} (${item.count} cobro${item.count !== 1 ? 's' : ''})`,
        y,
      );
    }
    y += 4;
  }

  const monthSeries = report.monthlySeries ?? [];
  if (monthSeries.length > 0) {
    y = writeLine(doc, 'VENTAS POR MES', y, { size: 12, bold: true });
    for (const month of monthSeries) {
      y = writeLine(
        doc,
        `- ${formatReportMonth(month.date)}: ${formatPrice(month.total)} (${month.paidOrderCount} pedido${month.paidOrderCount !== 1 ? 's' : ''})`,
        y,
      );
    }
    y += 4;
  } else if (report.dailySeries.length > 1) {
    y = writeLine(doc, 'VENTAS POR DIA', y, { size: 12, bold: true });
    for (const day of report.dailySeries) {
      y = writeLine(
        doc,
        `- ${formatReportDate(day.date)}: ${formatPrice(day.total)} (${day.paidOrderCount} pedido${day.paidOrderCount !== 1 ? 's' : ''})`,
        y,
      );
    }
    y += 4;
  }

  if (report.topProducts.length > 0) {
    y = writeLine(doc, 'TOP PRODUCTOS', y, { size: 12, bold: true });
    report.topProducts.forEach((product, index) => {
      y = writeLine(
        doc,
        `${index + 1}. ${product.productName} — ${product.quantity} uds — ${formatPrice(product.total)}`,
        y,
      );
    });
  }

  const filename = `reporte-${report.from}${report.from !== report.to ? `_a_${report.to}` : ''}.pdf`;
  doc.save(filename);
}
