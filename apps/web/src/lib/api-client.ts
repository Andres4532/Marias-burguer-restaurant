const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export { API_URL };

export interface ApiError {
  message: string | string[];
  statusCode: number;
}

export function parseApiError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Error desconocido. Verifica tu conexión.';
  }

  const msg = (error as ApiError).message;

  if (Array.isArray(msg)) {
    return msg[0] ?? 'Error en la solicitud';
  }

  if (typeof msg === 'string' && msg.length > 0) {
    return msg;
  }

  const status = (error as ApiError).statusCode;
  if (status === 401) return 'Sesión expirada. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para esta acción.';
  if (status === 429) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  if (status === 404) return 'Recurso no encontrado.';
  if (status >= 500) return 'Error del servidor. Intenta de nuevo.';

  return 'Error de conexión con el servidor';
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw { message: 'Sin conexión con el servidor', statusCode: 0 };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Error de conexión con el servidor',
      statusCode: response.status,
    }));
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
