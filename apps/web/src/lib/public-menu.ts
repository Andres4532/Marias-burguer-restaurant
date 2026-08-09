import { apiFetch, parseApiError } from './api-client';
import { getApiUrl } from './api-url';
import type { CatalogCategory } from '@/types/catalog';
import type { Order, PaymentMethod } from '@/types/orders';
import type { CreateOrderItemInput, OrderType, OrderStatus } from '@/types/orders';

export interface PublicMenuResponse {
  restaurant: {
    name: string;
    slug: string;
    phone: string | null;
    logoUrl: string | null;
    qrImageUrl: string | null;
  };
  categories: CatalogCategory[];
}

export interface CreatePublicOrderInput {
  type?: OrderType;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryReference?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentProofUrl?: string;
  items: CreateOrderItemInput[];
}

export const getPublicMenu = (slug: string) =>
  apiFetch<PublicMenuResponse>(`/public/menu/${slug}`);

export interface PublicMenuLink {
  name: string;
  slug: string;
  logoUrl: string | null;
  publicMenuEnabled: boolean;
}

export const getPublicMenuLink = () =>
  apiFetch<PublicMenuLink>('/public/menu/link');

export const createPublicOrder = (slug: string, data: CreatePublicOrderInput) =>
  apiFetch<Order>(`/public/menu/${slug}/orders`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export interface PublicOrderTracking {
  orderNumber: number;
  status: OrderStatus;
  type: OrderType;
  total: number;
  updatedAt: string;
  customerName: string | null;
  message: string;
}

export const trackPublicOrder = (token: string) =>
  apiFetch<PublicOrderTracking>(`/public/menu/track/${token}`);

export async function uploadPublicPaymentProof(
  slug: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}/public/menu/${slug}/upload-proof`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw { message: 'Sin conexión con el servidor', statusCode: 0 };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error al subir comprobante',
      statusCode: response.status,
    }));
    throw error;
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export function getPublicMenuErrorMessage(error: unknown): string {
  return parseApiError(error);
}
