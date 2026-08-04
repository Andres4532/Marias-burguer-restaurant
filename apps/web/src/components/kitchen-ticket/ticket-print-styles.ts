export const TICKET_WIDTH_MM = 76;

export function buildTicketPrintCss(pageHeightMm: number): string {
  const w = TICKET_WIDTH_MM;

  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: ${w}mm;
    height: auto;
    margin: 0;
    padding: 0;
    overflow: visible;
    background: #fff;
    color: #000;
  }

  @page {
    size: 80mm ${pageHeightMm}mm;
    margin: 1mm 2mm;
  }

  .kitchen-ticket-print-set {
    width: ${w}mm;
    max-width: ${w}mm;
    background: #fff;
  }

  .kitchen-ticket-copy {
    display: block;
    width: 100%;
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: always;
    break-after: page;
    padding-bottom: 14mm;
  }

  .kitchen-ticket-copy:last-child {
    page-break-after: auto;
    break-after: auto;
    padding-bottom: 4mm;
  }

  .kitchen-ticket {
    width: 100%;
    max-width: ${w}mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    font-weight: 700;
    color: #000;
    background: #fff;
    padding: 1mm 0;
    line-height: 1.45;
    overflow: visible;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .ticket-header {
    display: block;
    text-align: center;
    margin-bottom: 4mm;
  }

  .ticket-title {
    display: block;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 2mm;
    letter-spacing: 0.08em;
  }

  .ticket-order {
    display: block;
    font-size: 26px;
    font-weight: 900;
    margin-bottom: 2mm;
  }

  .ticket-time {
    display: block;
    font-size: 15px;
    font-weight: 900;
    margin-bottom: 2mm;
  }

  .ticket-destination {
    display: block;
    font-size: 17px;
    font-weight: 900;
    margin-bottom: 1mm;
    text-transform: uppercase;
    word-wrap: break-word;
  }

  .ticket-type {
    display: block;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .ticket-divider {
    display: block;
    border: none;
    border-top: 2px dashed #000;
    margin: 3mm 0;
    height: 0;
  }

  .ticket-item {
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 3mm;
  }

  .ticket-item-name {
    display: block;
    font-size: 17px;
    font-weight: 900;
    line-height: 1.35;
    word-wrap: break-word;
  }

  .ticket-qty { font-weight: 900; }

  .ticket-extras {
    display: block;
    margin: 1mm 0 0 3mm;
    font-size: 14px;
    font-weight: 800;
    list-style: none;
  }

  .ticket-extras li {
    display: block;
    line-height: 1.35;
  }

  .ticket-note,
  .ticket-order-note,
  .ticket-line {
    display: block;
    font-size: 14px;
    font-weight: 800;
    margin: 1mm 0;
    line-height: 1.4;
    word-wrap: break-word;
  }

  .ticket-total {
    display: block;
    text-align: center;
    font-size: 20px;
    font-weight: 900;
    margin: 2mm 0;
  }

  .ticket-payment-line {
    display: block;
    text-align: center;
    font-size: 14px;
    font-weight: 900;
    margin: 1mm 0;
  }

  .ticket-footer {
    display: block;
    text-align: center;
    font-size: 13px;
    font-weight: 800;
    margin-top: 2mm;
  }
`;
}

function measureElementPx(element: HTMLElement, widthMm: number): number {
  const probe = document.createElement('div');
  probe.style.cssText = `position:absolute;left:-9999px;top:0;width:${widthMm}mm;visibility:hidden;pointer-events:none`;
  const clone = element.cloneNode(true) as HTMLElement;
  probe.appendChild(clone);
  document.body.appendChild(probe);
  const px = probe.scrollHeight;
  probe.remove();
  return px;
}

function pxToMm(px: number): number {
  return Math.ceil((px * 25.4) / 96);
}

/** Altura de UNA copia + espacio de corte, para @page de la RP80. */
export function measureSingleCopyPageHeightMm(root: HTMLElement): number {
  const copy = root.querySelector('.kitchen-ticket-copy');
  if (!copy) {
    const px = measureElementPx(root, TICKET_WIDTH_MM);
    return Math.min(Math.max(pxToMm(px) + 30, 180), 1500);
  }

  const px = measureElementPx(copy as HTMLElement, TICKET_WIDTH_MM);
  const mm = pxToMm(px) + 20;
  return Math.min(Math.max(mm, 120), 800);
}

export function measureTicketHeightMm(root: HTMLElement): number {
  const px = measureElementPx(root, TICKET_WIDTH_MM);
  const mm = pxToMm(px) + 30;
  return Math.min(Math.max(mm, 180), 1500);
}
