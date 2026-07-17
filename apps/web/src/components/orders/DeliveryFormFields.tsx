'use client';

import { Input } from '@/components/ui/Input';
import { DeliveryLocationPicker } from '@/components/orders/DeliveryLocationPicker';

interface DeliveryFormFieldsProps {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryReference: string;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeliveryAddressChange: (value: string) => void;
  onDeliveryReferenceChange: (value: string) => void;
  onDeliveryLocationChange: (
    lat: number,
    lng: number,
    address?: string,
  ) => void;
}

export function DeliveryFormFields({
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryReference,
  deliveryLatitude,
  deliveryLongitude,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeliveryAddressChange,
  onDeliveryReferenceChange,
  onDeliveryLocationChange,
}: DeliveryFormFieldsProps) {
  const handleLocationChange = (
    lat: number,
    lng: number,
    address?: string,
  ) => {
    onDeliveryLocationChange(lat, lng, address);
    if (address) {
      onDeliveryAddressChange(address);
    }
  };

  return (
    <div className="space-y-3">
      <Input
        label="Nombre del cliente"
        placeholder="Ej: Juan Pérez"
        value={customerName}
        onChange={(e) => onCustomerNameChange(e.target.value)}
        required
      />
      <Input
        label="Teléfono"
        placeholder="Ej: 70000000"
        type="tel"
        value={customerPhone}
        onChange={(e) => onCustomerPhoneChange(e.target.value)}
        required
      />

      <DeliveryLocationPicker
        latitude={deliveryLatitude}
        longitude={deliveryLongitude}
        onLocationChange={handleLocationChange}
      />

      <Input
        label="Dirección de entrega"
        placeholder="Ej: Av. Principal #123, Zona Centro"
        value={deliveryAddress}
        onChange={(e) => onDeliveryAddressChange(e.target.value)}
        required
      />
      <Input
        label="Referencia (opcional)"
        placeholder="Ej: Casa verde, portón negro"
        value={deliveryReference}
        onChange={(e) => onDeliveryReferenceChange(e.target.value)}
      />
    </div>
  );
}
