import { formatOrderNumber } from '@/lib/orders';

/** Abre WhatsApp al cliente con aviso de que el pedido se está preparando. */
export function buildCustomerCookingWhatsAppUrl(
  phone: string,
  orderNumber: number,
  restaurantName: string,
): string {
  const digits = phone.replace(/\D/g, '');
  const normalized =
    digits.length === 8
      ? `591${digits}`
      : digits.startsWith('591')
        ? digits
        : digits;

  const text = encodeURIComponent(
    `¡Hola! Tu pedido ${formatOrderNumber(orderNumber)} en ${restaurantName} fue confirmado y ya se está preparando. 🍔`,
  );

  return `https://wa.me/${normalized}?text=${text}`;
}

const WHATSAPP_WINDOW_NAME = 'wa_customer_notify';

/** Reutiliza la misma pestaña de WhatsApp en lugar de abrir una nueva cada vez. */
export function openCustomerWhatsApp(url: string) {
  const win = window.open(url, WHATSAPP_WINDOW_NAME);
  win?.focus();
}
