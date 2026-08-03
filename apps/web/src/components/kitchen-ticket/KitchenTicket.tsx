import type { Order } from '@/types/orders';
import { formatOrderNumber, formatTime } from '@/lib/orders';
import { ORDER_TYPE_LABELS } from '@/types/orders';
import { getGoogleMapsUrl, hasDeliveryCoordinates } from '@/lib/maps';

interface KitchenTicketProps {
  order: Order;
}

export function KitchenTicket({ order }: KitchenTicketProps) {
  const typeLabel = ORDER_TYPE_LABELS[order.type];
  const mesaName =
    order.customerName?.trim() || order.tableNumber?.trim() || null;
  const destination =
    order.type === 'MESA'
      ? mesaName || typeLabel
      : order.type === 'DELIVERY'
        ? 'DELIVERY'
        : typeLabel;

  return (
    <div id="kitchen-ticket" className="kitchen-ticket">
      <div className="ticket-header">
        <h1 className="ticket-title">COCINA</h1>
        <p className="ticket-order">{formatOrderNumber(order.orderNumber)}</p>
        <p className="ticket-meta">
          {formatTime(order.createdAt)} · {destination}
        </p>
        <p className="ticket-type">{typeLabel.toUpperCase()}</p>
      </div>

      {order.type === 'MESA' && mesaName && (
        <>
          <hr className="ticket-divider" />
          <div className="ticket-delivery">
            <p className="ticket-delivery-title">MESA</p>
            <p className="ticket-delivery-line">
              <strong>Nombre:</strong> {mesaName}
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
              <p className="ticket-delivery-line">
                <strong>Cliente:</strong> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="ticket-delivery-line">
                <strong>Tel:</strong> {order.customerPhone}
              </p>
            )}
            {order.deliveryAddress && (
              <p className="ticket-delivery-line">
                <strong>Dir:</strong> {order.deliveryAddress}
              </p>
            )}
            {order.deliveryReference && (
              <p className="ticket-delivery-line">
                <strong>Ref:</strong> {order.deliveryReference}
              </p>
            )}
            {hasDeliveryCoordinates(
              order.deliveryLatitude,
              order.deliveryLongitude,
            ) && (
              <p className="ticket-delivery-line">
                <strong>Maps:</strong>{' '}
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
              <strong>{item.quantity}×</strong> {item.productName}
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
            <strong>Nota pedido:</strong> {order.notes}
          </p>
        </>
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
