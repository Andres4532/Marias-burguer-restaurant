function measureNodeHeightMm(node: HTMLElement): number {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;width:72mm;visibility:hidden;pointer-events:none';
  const clone = node.cloneNode(true) as HTMLElement;
  probe.appendChild(clone);
  document.body.appendChild(probe);
  const px = probe.scrollHeight;
  probe.remove();
  return Math.ceil((px * 25.4) / 96) + 4;
}

export function measureCopyHeightsMm(root: HTMLElement): number[] {
  const copies = root.querySelectorAll('.kitchen-ticket-copy');
  return Array.from(copies).map((copy) => {
    const mm = measureNodeHeightMm(copy as HTMLElement);
    return Math.min(Math.max(mm, 55), 1200);
  });
}

export function buildTicketPrintCss(copyHeightsMm: number[]): string {
  const pageRules = copyHeightsMm
    .map(
      (heightMm, index) =>
        `@page copy-page-${index} { size: 80mm ${heightMm}mm; margin: 0; }`,
    )
    .join('\n');

  const copyPageAssignments = copyHeightsMm
    .map(
      (_, index) =>
        `.kitchen-ticket-copy:nth-of-type(${index + 1}) { page: copy-page-${index}; }`,
    )
    .join('\n');

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

  ${pageRules}

  ${copyPageAssignments}

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
