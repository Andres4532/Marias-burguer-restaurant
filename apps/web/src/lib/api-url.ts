/**
 * URL base de la API (/auth/login, /public/menu/..., etc.)
 *
 * Local: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
 *
 * Vercel + API en internet (directo):
 *   NEXT_PUBLIC_API_URL=https://tu-api.com/api/v1
 *   y CORS_ORIGIN en la API = tu dominio Vercel
 *
 * Vercel + proxy (menos problemas de CORS):
 *   NEXT_PUBLIC_API_URL=/api/v1
 *   API_BACKEND_URL=https://tu-api.com/api/v1  (solo en Vercel, no NEXT_PUBLIC)
 */
export function getApiUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

  if (configured.startsWith('http://') || configured.startsWith('https://')) {
    return configured.replace(/\/$/, '');
  }

  const path = configured.startsWith('/') ? configured : '/api/v1';

  if (typeof window !== 'undefined') {
    return path;
  }

  const backend = process.env.API_BACKEND_URL?.replace(/\/$/, '');
  if (backend) return backend;

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel}${path}`;
  }

  return `http://localhost:3000${path}`;
}
