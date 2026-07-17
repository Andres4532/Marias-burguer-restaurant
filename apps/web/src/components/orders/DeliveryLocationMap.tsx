'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: '',
  html: `<span style="
    display:block;
    width:18px;
    height:18px;
    margin:-9px 0 0 -9px;
    background:#f97316;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
  "></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewSync({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

interface DeliveryLocationMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function DeliveryLocationMap({
  latitude,
  longitude,
  onLocationSelect,
}: DeliveryLocationMapProps) {
  const position = useMemo(
    () => [latitude, longitude] as [number, number],
    [latitude, longitude],
  );

  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={false}
      className="h-[220px] w-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewSync latitude={latitude} longitude={longitude} />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      <Marker
        position={position}
        icon={markerIcon}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const { lat, lng } = event.target.getLatLng();
            onLocationSelect(lat, lng);
          },
        }}
      />
    </MapContainer>
  );
}
