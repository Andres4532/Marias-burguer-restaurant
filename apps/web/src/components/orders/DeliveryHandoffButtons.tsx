'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { copyDeliveryWhatsAppMessage } from '@/lib/delivery-handoff';
import type { Order } from '@/types/orders';

interface DeliveryHandoffButtonsProps {
  order: Order;
  className?: string;
  layout?: 'stack' | 'row';
}

export function DeliveryHandoffButtons({
  order,
  className = '',
  layout = 'stack',
}: DeliveryHandoffButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    setError('');
    try {
      await copyDeliveryWhatsAppMessage(order);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar el mensaje');
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={layout === 'stack' ? 'w-full' : ''}
        onClick={handleCopy}
      >
        {copied ? '¡Copiado!' : 'Copiar para Speed'}
      </Button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
