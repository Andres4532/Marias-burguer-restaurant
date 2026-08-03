import type { MetadataRoute } from 'next';
import {
  getPublicBrandingForMetadata,
  getFaviconUrl,
} from '@/lib/branding';

const FALLBACK_ICONS = [
  {
    src: '/icons/favicon.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: '/icons/icon-192.svg',
    sizes: '192x192',
    type: 'image/svg+xml',
    purpose: 'any',
  },
  {
    src: '/icons/icon-512.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any',
  },
] as const satisfies MetadataRoute.Manifest['icons'];

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getPublicBrandingForMetadata();
  const logo = getFaviconUrl(branding.logoUrl);
  const shortName =
    branding.name.length > 12 ? `${branding.name.slice(0, 12).trim()}…` : branding.name;

  return {
    name: branding.name,
    short_name: shortName,
    description: 'Sistema de ventas para restaurante',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ea580c',
    lang: 'es',
    icons: logo
      ? [
          {
            src: logo,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          ...FALLBACK_ICONS,
        ]
      : [...FALLBACK_ICONS],
  };
}
