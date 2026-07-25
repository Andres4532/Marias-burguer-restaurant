/** Normaliza URLs de medios guardadas (p. ej. doble barra por API_PUBLIC_URL con / final). */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (!trimmed.includes('://')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
    return parsed.toString();
  } catch {
    return trimmed.replace(/([^:]\/)\/+/g, '$1');
  }
}
