import { apiFetch } from './api-client';
import { getToken } from './auth';

export interface RestaurantSettings {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  logoUrl: string | null;
  qrImageUrl: string | null;
  publicMenuEnabled: boolean;
  publicMenuOpenTime: string | null;
  publicMenuCloseTime: string | null;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  name?: string;
  slug?: string;
  phone?: string;
  logoUrl?: string;
  qrImageUrl?: string;
  publicMenuEnabled?: boolean;
  publicMenuOpenTime?: string;
  publicMenuCloseTime?: string;
}

function token() {
  return getToken();
}

export const getSettings = () =>
  apiFetch<RestaurantSettings>('/settings', {}, token());

export const updateSettings = (data: UpdateSettingsInput) =>
  apiFetch<RestaurantSettings>(
    '/settings',
    { method: 'PATCH', body: JSON.stringify(data) },
    token(),
  );

export function getPublicMenuUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/menu/${slug}`;
  }
  return `/menu/${slug}`;
}

export function formatMenuSchedule(
  open: string | null,
  close: string | null,
): string {
  if (!open || !close) return 'Siempre disponible';
  return `${open} — ${close}`;
}
