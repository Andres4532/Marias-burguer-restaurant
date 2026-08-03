import { apiFetch } from './api-client';
import { getApiUrl } from './api-url';
import { normalizeMediaUrl } from './media-url';

export interface RestaurantBranding {
  name: string;
  logoUrl: string | null;
}

export const getPublicBranding = () =>
  apiFetch<RestaurantBranding>('/public/menu/branding');

export async function getPublicBrandingForMetadata(): Promise<RestaurantBranding> {
  try {
    const response = await fetch(`${getApiUrl()}/public/menu/branding`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return { name: 'POS Restaurante', logoUrl: null };
    }
    return response.json();
  } catch {
    return { name: 'POS Restaurante', logoUrl: null };
  }
}

export function getFaviconUrl(logoUrl: string | null | undefined): string | null {
  return normalizeMediaUrl(logoUrl);
}

const STATIC_FAVICON = '/icons/favicon.png';
const FALLBACK_FAVICON = '/icons/icon-192.svg';

export function getSiteIcons(logoUrl: string | null | undefined) {
  const favicon = getFaviconUrl(logoUrl);

  if (favicon) {
    return {
      icon: [
        { url: favicon },
        { url: FALLBACK_FAVICON, type: 'image/svg+xml' },
      ],
      apple: favicon,
    };
  }

  return {
    icon: [
      { url: STATIC_FAVICON, type: 'image/png' },
      { url: FALLBACK_FAVICON, type: 'image/svg+xml' },
    ],
    apple: STATIC_FAVICON,
  };
}
