import { getGoogleMapsUrl, getWazeUrl, hasDeliveryCoordinates } from '@/lib/maps';

interface DeliveryMapLinksProps {
  latitude: number | null;
  longitude: number | null;
}

export function DeliveryMapLinks({ latitude, longitude }: DeliveryMapLinksProps) {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !hasDeliveryCoordinates(latitude, longitude)
  ) {
    return null;
  }

  const lat = latitude;
  const lng = longitude;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <a
        href={getGoogleMapsUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-white/[0.06] transition"
      >
        Abrir en Google Maps
      </a>
      <a
        href={getWazeUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-white/[0.06] transition"
      >
        Abrir en Waze
      </a>
    </div>
  );
}
