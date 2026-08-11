const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: String(lat),
      lon: String(lng),
      zoom: '18',
      addressdetails: '1',
    });

    const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'es',
        'User-Agent': 'SistemaRestaurante/1.0',
      },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { display_name?: string };
    return data.display_name?.trim() || null;
  } catch {
    return null;
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export type GeolocationPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported';

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }

  if (navigator.permissions?.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
      return 'prompt';
    } catch {
      // Safari u otros navegadores pueden no soportar la consulta.
    }
  }

  return 'prompt';
}

export async function requestGeolocationPermission(): Promise<GeolocationPermissionState> {
  const current = await getGeolocationPermissionState();
  if (current === 'granted' || current === 'unsupported') {
    return current;
  }

  try {
    await getCurrentPosition();
    return 'granted';
  } catch {
    return getGeolocationPermissionState();
  }
}
