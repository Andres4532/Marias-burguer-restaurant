'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { Button } from '@/components/ui/Button';
import { DEFAULT_MAP_CENTER } from '@/lib/maps';
import { getCurrentPosition, reverseGeocode } from '@/lib/geocoding';

type DeliveryLocationMapProps = {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
};

const mapFallback = (
  <div className="h-[220px] w-full rounded-xl bg-background border border-border animate-pulse" />
);

interface DeliveryLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export function DeliveryLocationPicker({
  latitude,
  longitude,
  onLocationChange,
}: DeliveryLocationPickerProps) {
  const [MapComponent, setMapComponent] =
    useState<ComponentType<DeliveryLocationMapProps> | null>(null);
  const [locating, setLocating] = useState(false);
  const [initialLocating, setInitialLocating] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [mapError, setMapError] = useState('');
  const [viewCenter, setViewCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLocationDone = useRef(false);

  const mapLat = latitude ?? viewCenter?.lat ?? DEFAULT_MAP_CENTER.lat;
  const mapLng = longitude ?? viewCenter?.lng ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    let active = true;

    import('./DeliveryLocationMap').then((mod) => {
      if (active) {
        setMapComponent(() => mod.default);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initialLocationDone.current || latitude != null || longitude != null) {
      setInitialLocating(false);
      return;
    }

    let active = true;
    initialLocationDone.current = true;
    setInitialLocating(true);
    setMapError('');

    getCurrentPosition()
      .then(async (position) => {
        if (!active) return;

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setViewCenter({ lat, lng });
        onLocationChange(lat, lng);

        setGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        setGeocoding(false);

        if (active) {
          onLocationChange(lat, lng, address ?? undefined);
        }
      })
      .catch(() => {
        if (active) {
          setMapError(
            'No se detectó tu ubicación. Marca el punto en el mapa o usa el botón.',
          );
        }
      })
      .finally(() => {
        if (active) setInitialLocating(false);
      });

    return () => {
      active = false;
    };
  }, [latitude, longitude, onLocationChange]);

  const applyLocation = useCallback(
    (lat: number, lng: number, address?: string) => {
      onLocationChange(lat, lng, address);
    },
    [onLocationChange],
  );

  const resolveAddress = useCallback(
    (lat: number, lng: number) => {
      if (geocodeTimer.current) {
        clearTimeout(geocodeTimer.current);
      }

      geocodeTimer.current = setTimeout(async () => {
        setGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        setGeocoding(false);
        applyLocation(lat, lng, address ?? undefined);
      }, 500);
    },
    [applyLocation],
  );

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      setMapError('');
      applyLocation(lat, lng);
      resolveAddress(lat, lng);
    },
    [applyLocation, resolveAddress],
  );

  const handleUseMyLocation = async () => {
    setMapError('');
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setViewCenter({ lat, lng });
      applyLocation(lat, lng);
      resolveAddress(lat, lng);
    } catch {
      setMapError('No se pudo obtener tu ubicación. Marca el punto en el mapa.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (geocodeTimer.current) {
        clearTimeout(geocodeTimer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">Ubicación en mapa</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={locating || initialLocating}
        >
          {locating || initialLocating ? 'Ubicando…' : '📍 Usar mi ubicación'}
        </Button>
      </div>

      <p className="text-xs text-text-secondary">
        {initialLocating
          ? 'Detectando tu ubicación…'
          : 'Toca el mapa o arrastra el pin para marcar dónde entregar.'}
        {geocoding ? ' Buscando dirección…' : ''}
      </p>

      {MapComponent ? (
        <MapComponent
          latitude={mapLat}
          longitude={mapLng}
          onLocationSelect={handleLocationSelect}
        />
      ) : (
        mapFallback
      )}

      {latitude != null && longitude != null && (
        <p className="text-[11px] text-text-secondary font-mono">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}

      {mapError && <p className="text-xs text-red-400">{mapError}</p>}
    </div>
  );
}
