import { formatOrderNumber } from '@/lib/orders';

export type CustomerWhatsAppNotifyKind = 'COOKING' | 'ON_THE_WAY';

const DEFAULT_RESTAURANT_NAME = 'Mi Restaurante';

export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.length === 8) {
    return `591${digits}`;
  }

  if (digits.startsWith('591')) {
    return digits;
  }

  return digits;
}

function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildCustomerWhatsAppUrl(
  kind: CustomerWhatsAppNotifyKind,
  phone: string,
  orderNumber: number,
  restaurantName = DEFAULT_RESTAURANT_NAME,
): string | null {
  const orderLabel = formatOrderNumber(orderNumber);
  const place = restaurantName.trim() || DEFAULT_RESTAURANT_NAME;

  const message =
    kind === 'COOKING'
      ? `¡Hola! Tu pedido ${orderLabel} en ${place} fue confirmado y ya se está preparando. 🍔`
      : `¡Hola! Tu pedido ${orderLabel} en ${place} ya salió en delivery y va en camino hacia ti. 🛵`;

  return buildWhatsAppUrl(phone, message);
}

/** @deprecated Usa buildCustomerWhatsAppUrl('COOKING', ...) */
export function buildCustomerCookingWhatsAppUrl(
  phone: string,
  orderNumber: number,
  restaurantName: string,
): string {
  return (
    buildCustomerWhatsAppUrl('COOKING', phone, orderNumber, restaurantName) ?? ''
  );
}

export function openCustomerWhatsApp(url: string) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function notifyCustomerByWhatsApp(
  kind: CustomerWhatsAppNotifyKind,
  phone: string | null | undefined,
  orderNumber: number,
  restaurantName = DEFAULT_RESTAURANT_NAME,
) {
  if (!phone?.trim()) return;

  const url = buildCustomerWhatsAppUrl(
    kind,
    phone,
    orderNumber,
    restaurantName,
  );
  if (url) {
    openCustomerWhatsApp(url);
  }
}
