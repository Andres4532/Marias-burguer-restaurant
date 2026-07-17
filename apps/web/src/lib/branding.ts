import { apiFetch } from './api-client';

export interface RestaurantBranding {
  name: string;
  logoUrl: string | null;
}

export const getPublicBranding = () =>
  apiFetch<RestaurantBranding>('/public/menu/branding');
