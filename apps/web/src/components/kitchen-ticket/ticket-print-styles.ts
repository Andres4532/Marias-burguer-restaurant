const PX_PER_MM = 96 / 25.4;

function pxToMm(px: number): number {
  return Math.ceil(px / PX_PER_MM);
}

/** Altura exacta de una copia del ticket (una página térmica). */
export function measureCopyHeightMm(copy: HTMLElement): number {
  const heightPx = Math.max(copy.scrollHeight, copy.offsetHeight);
  if (heightPx === 0) {
    return 80;
  }
  return Math.min(Math.max(pxToMm(heightPx) + 3, 40), 600);
}

export function applyPerCopyPageHeights(root: HTMLElement): void {
  root.querySelectorAll('.kitchen-ticket-copy').forEach((node) => {
    const copy = node as HTMLElement;
    const heightMm = measureCopyHeightMm(copy);
    copy.style.height = `${heightMm}mm`;
    copy.style.minHeight = `${heightMm}mm`;
    copy.style.boxSizing = 'border-box';
  });
}

export function buildTicketPrintCss(): string {
  return `
  @page { size: 80mm auto; margin: 0; }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 72mm;
    height: auto;
    margin: 0;
    padding: 0;
    overflow: visible;
    background: #fff;
    color: #000;
  }

  .kitchen-ticket-print-set {
    width: 72mm;
    max-width: 72mm;
    background: #fff;
  }

  .kitchen-ticket-copy {
    display: block;
    width: 100%;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    padding-bottom: 4mm;
  }

  .kitchen-ticket-copy:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .kitchen-ticket {
    width: 100%;
    max-width: 72mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    font-weight: 700;
    color: #000;
    background: #fff;
    padding: 1mm;
    line-height: 1.35;
    overflow: visible;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .ticket-header {
    display: block;
    text-align: center;
    margin-bottom: 3mm;
  }

  .ticket-title {
    display: block;
    font-size: 16px;
    font-weight: 900;
    margin-bottom: 1.5mm;
    letter-spacing: 0.08em;
  }

  .ticket-order {
    display: block;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 1.5mm;
  }

  .ticket-time {
    display: block;
    font-size: 13px;
    font-weight: 900;
    margin-bottom: 1.5mm;
  }

  .ticket-destination {
    display: block;
    font-size: 14px;
    font-weight: 900;
    margin-bottom: 1mm;
    text-transform: uppercase;
    word-wrap: break-word;
  }

  .ticket-type {
    display: block;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .ticket-divider {
    display: block;
    border: none;
    border-top: 2px dashed #000;
    margin: 2mm 0;
    height: 0;
  }

  .ticket-item {
    display: block;
    margin-bottom: 2mm;
  }

  .ticket-item-name {
    display: block;
    font-size: 14px;
    font-weight: 900;
    line-height: 1.35;
    word-wrap: break-word;
  }

  .ticket-qty { font-weight: 900; }

  .ticket-extras {
    display: block;
    margin: 1mm 0 0 3mm;
    font-size: 12px;
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
    font-size: 12px;
    font-weight: 800;
    margin: 1mm 0;
    line-height: 1.35;
    word-wrap: break-word;
  }

  .ticket-total {
    display: block;
    text-align: center;
    font-size: 16px;
    font-weight: 900;
    margin: 1.5mm 0;
  }

  .ticket-payment-line {
    display: block;
    text-align: center;
    font-size: 12px;
    font-weight: 900;
    margin: 0.5mm 0;
  }

  .ticket-footer {
    display: block;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    margin-top: 1.5mm;
  }
`;
}
