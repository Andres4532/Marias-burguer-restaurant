import { normalizeMediaUrl } from './media-url';

function guessFilename(url: string, fallback = 'qr-pago'): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop();
    if (base && /\.[a-z0-9]+$/i.test(base)) return base;
  } catch {
    // URL relativa o inválida: usamos el nombre por defecto.
  }
  return `${fallback}.jpg`;
}

export async function downloadMediaFile(
  url: string,
  filename?: string,
): Promise<void> {
  const normalized = normalizeMediaUrl(url) ?? url;
  const name = filename ?? guessFilename(normalized);

  try {
    const response = await fetch(normalized);
    if (!response.ok) throw new Error('No se pudo descargar la imagen');

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    const link = document.createElement('a');
    link.href = normalized;
    link.download = name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
