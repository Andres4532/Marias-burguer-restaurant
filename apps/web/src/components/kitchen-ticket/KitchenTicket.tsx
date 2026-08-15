import type { Order } from '@/types/orders';
import { formatOrderNumber, formatTime } from '@/lib/orders';
import { formatPrice } from '@/lib/catalog';
import { formatCartSauceLine } from '@/lib/sauce-labels';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/orders';
import { getGoogleMapsUrl, hasDeliveryCoordinates } from '@/lib/maps';
import {
  buildTicketPrintCss,
  measureTicketPageHeightMm,
} from './ticket-print-styles';

export const TICKET_COPIES = ['COCINA', 'CAJA'] as const;
export type TicketCopyLabel = (typeof TICKET_COPIES)[number];

interface KitchenTicketProps {
  order: Order;
  copyLabel?: TicketCopyLabel;
}

function getTicketContext(order: Order) {
  const typeLabel = ORDER_TYPE_LABELS[order.type];
  const pickupName = order.customerName?.trim() || null;
  const mesaName = pickupName || order.tableNumber?.trim() || null;

  let headline = '';
  if (order.type === 'MESA') {
    headline = mesaName || 'MESA';
  } else if (order.type === 'PARA_LLEVAR') {
    headline = pickupName ? `RECOJO ${pickupName}` : 'PARA RECOJO';
  } else if (order.type === 'DELIVERY') {
    headline = order.customerName?.trim() || 'DELIVERY';
  } else {
    headline = typeLabel.toUpperCase();
  }

  return { typeLabel, pickupName, mesaName, headline };
}

export function KitchenTicket({ order, copyLabel = 'COCINA' }: KitchenTicketProps) {
  const { typeLabel, pickupName, mesaName, headline } = getTicketContext(order);

  return (
    <article className="kitchen-ticket">
      <header className="ticket-header">
        <p className="ticket-title">{copyLabel}</p>
        <p className="ticket-order">{formatOrderNumber(order.orderNumber)}</p>
        <p className="ticket-time">{formatTime(order.createdAt)}</p>
        <p className="ticket-destination">{headline}</p>
        {order.type === 'DELIVERY' && (
          <p className="ticket-type">{typeLabel.toUpperCase()}</p>
        )}
      </header>

      {order.type === 'DELIVERY' && (
        <>
          <hr className="ticket-divider" />
          <div className="ticket-block">
            {order.customerName && (
              <p className="ticket-line ticket-name-line">
                <span className="ticket-label">Cliente:</span> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="ticket-line">
                <span className="ticket-label">Tel:</span> {order.customerPhone}
              </p>
            )}
            {order.deliveryAddress && (
              <p className="ticket-line">
                <span className="ticket-label">Dir:</span> {order.deliveryAddress}
              </p>
            )}
            {order.deliveryReference && (
              <p className="ticket-line">
                <span className="ticket-label">Ref:</span> {order.deliveryReference}
              </p>
            )}
            {hasDeliveryCoordinates(
              order.deliveryLatitude,
              order.deliveryLongitude,
            ) && (
              <p className="ticket-line ticket-line-wrap">
                <span className="ticket-label">Maps:</span>{' '}
                {getGoogleMapsUrl(
                  order.deliveryLatitude!,
                  order.deliveryLongitude!,
                )}
              </p>
            )}
          </div>
        </>
      )}

      <hr className="ticket-divider" />

      <section className="ticket-items">
        {order.items.map((item) => (
          <div key={item.id} className="ticket-item">
            <p className="ticket-item-name">
              <span className="ticket-qty">{item.quantity}x</span> {item.productName}
            </p>
            {item.extras.length > 0 && (
              <ul className="ticket-extras">
                {item.extras.map((extra) => (
                  <li key={extra.id}>+ {extra.extraName}</li>
                ))}
              </ul>
            )}
            {(item.sauces ?? []).length > 0 && (
              <ul className="ticket-extras">
                {(item.sauces ?? []).map((sauce) => (
                  <li key={sauce.id}>
                    Salsa: {formatCartSauceLine(sauce.sauceName, sauce.placement)}
                  </li>
                ))}
              </ul>
            )}
            {item.notes && (
              <p className="ticket-note">Nota: {item.notes}</p>
            )}
          </div>
        ))}
      </section>

      {order.notes && (
        <>
          <hr className="ticket-divider" />
          <p className="ticket-order-note">
            <span className="ticket-label">Nota pedido:</span> {order.notes}
          </p>
        </>
      )}

      <hr className="ticket-divider" />

      <p className="ticket-total">{formatPrice(order.total)}</p>
      {order.payment && (
        <div className="ticket-payment">
          <p className="ticket-payment-line">
            COBRADO: {PAYMENT_METHOD_LABELS[order.payment.method]}
          </p>
          <p className="ticket-payment-line">
            RECIBIDO: {formatPrice(order.payment.amount)}
          </p>
        </div>
      )}

      <hr className="ticket-divider" />
      <p className="ticket-footer">
        {formatOrderNumber(order.orderNumber)} · {copyLabel}
      </p>
    </article>
  );
}

export function KitchenTicketPrintSet({ order }: { order: Order }) {
  return (
    <div id="kitchen-ticket-print-set" className="kitchen-ticket-print-set">
      {TICKET_COPIES.map((copyLabel) => (
        <div key={copyLabel} className="kitchen-ticket-copy">
          <KitchenTicket order={order} copyLabel={copyLabel} />
        </div>
      ))}
    </div>
  );
}

export function printKitchenTicket() {
  const root = document.getElementById('kitchen-ticket-print-set');
  if (!root || !root.innerHTML.trim()) {
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;border:0;z-index:-1;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title></title></head><body></body></html>',
  );
  doc.close();

  const style = doc.createElement('style');
  doc.head.appendChild(style);

  const clone = root.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  doc.body.appendChild(clone);

  style.textContent = buildTicketPrintCss(300);

  window.requestAnimationFrame(() => {
    const pageHeightMm = measureTicketPageHeightMm(clone);
    style.textContent = buildTicketPrintCss(pageHeightMm);

    window.setTimeout(() => {
      win?.focus();
      win?.print();
      window.setTimeout(() => iframe.remove(), 2000);
    }, 150);
  });
}
