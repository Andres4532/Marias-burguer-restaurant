export function buildTicketPrintCss(pageHeightMm: number): string {
  return `
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

  @page {
    size: 80mm ${pageHeightMm}mm;
    margin: 2mm;
  }

  .kitchen-ticket-print-set,
  .kitchen-ticket-copy,
  .kitchen-ticket,
  .ticket-items,
  .ticket-item {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .kitchen-ticket-print-set {
    width: 72mm;
    max-width: 72mm;
    background: #fff;
  }

  .kitchen-ticket-copy {
    display: block;
    width: 100%;
  }

  .ticket-copy-gap {
    display: block;
    padding: 8mm 0 6mm;
    text-align: center;
  }

  .ticket-cut-line {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .kitchen-ticket {
    width: 100%;
    max-width: 72mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    font-weight: 700;
    color: #000;
    background: #fff;
    padding: 2mm 1mm;
    line-height: 1.4;
    overflow: visible;
  }

  .ticket-header {
    display: block;
    text-align: center;
    margin-bottom: 4mm;
  }

  .ticket-title {
    display: block;
    font-size: 16px;
    font-weight: 900;
    margin-bottom: 2mm;
    letter-spacing: 0.08em;
  }

  .ticket-order {
    display: block;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 2mm;
  }

  .ticket-time {
    display: block;
    font-size: 13px;
    font-weight: 900;
    margin-bottom: 2mm;
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
    margin: 3mm 0;
    height: 0;
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
    margin: 2mm 0;
  }

  .ticket-payment-line {
    display: block;
    text-align: center;
    font-size: 12px;
    font-weight: 900;
    margin: 1mm 0;
  }

  .ticket-footer {
    display: block;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    margin-top: 2mm;
  }
`;
}

export function measureTicketHeightMm(root: HTMLElement): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;width:72mm;visibility:hidden;pointer-events:none';
  const clone = root.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  probe.appendChild(clone);
  document.body.appendChild(probe);
  const px = probe.scrollHeight;
  probe.remove();

  const mm = Math.ceil((px * 25.4) / 96) + 30;
  return Math.min(Math.max(mm, 180), 1500);
}
