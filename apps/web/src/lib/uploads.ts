import { getApiUrl } from './api-url';
import { parseApiError } from './api-client';
import { getToken } from './auth';

export interface UploadResponse {
  url: string;
}

async function uploadImage(file: File, path: string): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw { message: 'Sin conexión con el servidor', statusCode: 0 };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error al subir imagen',
      statusCode: response.status,
    }));
    throw error;
  }

  const data = (await response.json()) as UploadResponse;
  return data.url;
}

export const uploadProductImage = (file: File) =>
  uploadImage(file, '/uploads/product-image');

export const uploadLogo = (file: File) => uploadImage(file, '/uploads/logo');

export const uploadQrImage = (file: File) => uploadImage(file, '/uploads/qr');

export function getUploadErrorMessage(error: unknown): string {
  return parseApiError(error);
}
