import { formatOrderNumber } from '@/lib/orders';
import { formatPrice } from '@/lib/catalog';
import { getGoogleMapsUrl, hasDeliveryCoordinates } from '@/lib/maps';
import type { Order } from '@/types/orders';

function formatOrderItems(order: Order): string {
  return order.items
    .map((item) => {
      const extras =
        item.extras.length > 0
          ? ` (${item.extras.map((e) => e.extraName).join(', ')})`
          : '';
      const note = item.notes ? ` — Nota: ${item.notes}` : '';
      return `• ${item.quantity}× ${item.productName}${extras}${note}`;
    })
    .join('\n');
}

export function formatDeliveryWhatsAppMessage(order: Order): string {
  const lines: string[] = [
    `🛵 DELIVERY ${formatOrderNumber(order.orderNumber)}`,
    '',
  ];

  if (order.customerName) {
    lines.push(`Cliente: ${order.customerName}`);
  }
  if (order.customerPhone) {
    lines.push(`Tel: ${order.customerPhone}`);
  }
  if (order.deliveryAddress) {
    lines.push(`Dirección: ${order.deliveryAddress}`);
  }
  if (order.deliveryReference) {
    lines.push(`Referencia: ${order.deliveryReference}`);
  }
  if (
    hasDeliveryCoordinates(order.deliveryLatitude, order.deliveryLongitude)
  ) {
    lines.push(
      `📍 Maps: ${getGoogleMapsUrl(order.deliveryLatitude!, order.deliveryLongitude!)}`,
    );
  }

  lines.push('', `Total: ${formatPrice(order.total)}`, '', 'Pedido:', formatOrderItems(order));

  if (order.notes) {
    lines.push('', `Nota pedido: ${order.notes}`);
  }

  return lines.join('\n');
}

export async function copyDeliveryWhatsAppMessage(order: Order): Promise<void> {
  await navigator.clipboard.writeText(formatDeliveryWhatsAppMessage(order));
}
