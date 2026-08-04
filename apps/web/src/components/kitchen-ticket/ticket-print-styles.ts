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
    padding: 2mm 1mm;
    line-height: 1.4;
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

  .ticket-item {
    display: block;
    margin-bottom: 3mm;
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

function measureNodeHeightMm(node: HTMLElement): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;width:72mm;visibility:hidden;pointer-events:none';
  const clone = node.cloneNode(true) as HTMLElement;
  probe.appendChild(clone);
  document.body.appendChild(probe);
  const px = probe.scrollHeight;
  probe.remove();
  return Math.ceil((px * 25.4) / 96) + 12;
}

/** Altura de la copia más larga para que cada página quepa entera y la impresora corte. */
export function measureMaxCopyHeightMm(root: HTMLElement): number {
  const copies = root.querySelectorAll('.kitchen-ticket-copy');
  let maxMm = 120;

  copies.forEach((copy) => {
    maxMm = Math.max(maxMm, measureNodeHeightMm(copy as HTMLElement));
  });

  return Math.min(maxMm, 1200);
}
