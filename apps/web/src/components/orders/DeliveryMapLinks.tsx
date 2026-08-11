import { getGoogleMapsUrl, hasDeliveryCoordinates } from '@/lib/maps';

interface DeliveryMapLinksProps {
  latitude: number | null;
  longitude: number | null;
  fullWidth?: boolean;
}

export function DeliveryMapLinks({
  latitude,
  longitude,
  fullWidth = false,
}: DeliveryMapLinksProps) {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !hasDeliveryCoordinates(latitude, longitude)
  ) {
    return null;
  }

  return (
    <a
      href={getGoogleMapsUrl(latitude, longitude)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-foreground hover:bg-white/[0.06] transition ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      Google Maps
    </a>
  );
}
