import type { Order } from '@/types/orders';
import { formatOrderNumber, formatTime } from '@/lib/orders';
import { formatPrice } from '@/lib/catalog';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '@/types/orders';
import { getGoogleMapsUrl, hasDeliveryCoordinates } from '@/lib/maps';

interface KitchenTicketProps {
  order: Order;
}

export function KitchenTicket({ order }: KitchenTicketProps) {
  const typeLabel = ORDER_TYPE_LABELS[order.type];
  const pickupName = order.customerName?.trim() || null;
  const mesaName = pickupName || order.tableNumber?.trim() || null;
  const destination =
    order.type === 'MESA'
      ? mesaName || typeLabel
      : order.type === 'PARA_LLEVAR'
        ? pickupName || typeLabel
      : order.type === 'DELIVERY'
        ? 'DELIVERY'
        : typeLabel;

  return (
    <div id="kitchen-ticket" className="kitchen-ticket">
      <div className="ticket-header">
        <h1 className="ticket-title">COCINA</h1>
        <p className="ticket-order">{formatOrderNumber(order.orderNumber)}</p>
        <p className="ticket-time">{formatTime(order.createdAt)}</p>
        <p className="ticket-destination">{destination}</p>
        <p className="ticket-type">{typeLabel.toUpperCase()}</p>
      </div>

      {order.type === 'MESA' && mesaName && (
        <>
          <hr className="ticket-divider" />
          <div className="ticket-delivery">
            <p className="ticket-delivery-title">MESA</p>
            <p className="ticket-delivery-line ticket-name-line">
              <span className="ticket-label">Nombre:</span> {mesaName}
            </p>
          </div>
        </>
      )}

      {order.type === 'PARA_LLEVAR' && pickupName && (
        <>
          <hr className="ticket-divider" />
          <div className="ticket-delivery">
            <p className="ticket-delivery-title">PARA RECOJO</p>
            <p className="ticket-delivery-line ticket-name-line">
              <span className="ticket-label">Nombre:</span> {pickupName}
            </p>
          </div>
        </>
      )}

      {order.type === 'DELIVERY' && (
        <>
          <hr className="ticket-divider" />
          <div className="ticket-delivery">
            <p className="ticket-delivery-title">DATOS DE ENTREGA</p>
            {order.customerName && (
              <p className="ticket-delivery-line ticket-name-line">
                <span className="ticket-label">Cliente:</span> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="ticket-delivery-line">
                <span className="ticket-label">Tel:</span> {order.customerPhone}
              </p>
            )}
            {order.deliveryAddress && (
              <p className="ticket-delivery-line">
                <span className="ticket-label">Dir:</span> {order.deliveryAddress}
              </p>
            )}
            {order.deliveryReference && (
              <p className="ticket-delivery-line">
                <span className="ticket-label">Ref:</span> {order.deliveryReference}
              </p>
            )}
            {hasDeliveryCoordinates(
              order.deliveryLatitude,
              order.deliveryLongitude,
            ) && (
              <p className="ticket-delivery-line">
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

      <div className="ticket-items">
        {order.items.map((item) => (
          <div key={item.id} className="ticket-item">
            <p className="ticket-item-name">
              <span className="ticket-qty">{item.quantity}×</span> {item.productName}
            </p>
            {item.extras.length > 0 && (
              <ul className="ticket-extras">
                {item.extras.map((extra) => (
                  <li key={extra.id}>+ {extra.extraName}</li>
                ))}
              </ul>
            )}
            {item.notes && (
              <p className="ticket-note">Nota: {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {order.notes && (
        <>
          <hr className="ticket-divider" />
          <p className="ticket-order-note">
            <span className="ticket-label">Nota pedido:</span> {order.notes}
          </p>
        </>
      )}

      <hr className="ticket-divider" />

      <p className="ticket-total">TOTAL: {formatPrice(order.total)}</p>
      {order.payment && (
        <p className="ticket-total-paid">
          COBRADO · {PAYMENT_METHOD_LABELS[order.payment.method]} ·{' '}
          {formatPrice(order.payment.amount)}
        </p>
      )}

      <hr className="ticket-divider" />
      <p className="ticket-footer">
        {formatOrderNumber(order.orderNumber)} — {destination}
      </p>
    </div>
  );
}

export function printKitchenTicket() {
  window.print();
}
