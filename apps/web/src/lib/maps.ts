export const DEFAULT_MAP_CENTER = { lat: -17.7833, lng: -63.1821 };

export function getGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getWazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

export function hasDeliveryCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isDeliveryLocationComplete(
  address: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  return address.trim().length >= 5 || hasDeliveryCoordinates(lat, lng);
}
