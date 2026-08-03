import { apiFetch, parseApiError } from './api-client';
import type { CatalogCategory } from '@/types/catalog';
import type { Order } from '@/types/orders';
import type { CreateOrderItemInput, OrderType, OrderStatus } from '@/types/orders';

export interface PublicMenuResponse {
  restaurant: {
    name: string;
    slug: string;
    phone: string | null;
    logoUrl: string | null;
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

export function getPublicMenuErrorMessage(error: unknown): string {
  return parseApiError(error);
}
