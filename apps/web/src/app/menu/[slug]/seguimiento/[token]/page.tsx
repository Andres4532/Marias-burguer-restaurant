'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { trackPublicOrder, type PublicOrderTracking } from '@/lib/public-menu';
import { formatOrderNumber } from '@/lib/orders';
import { formatPrice } from '@/lib/catalog';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/orders';

const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDIENTE_CONFIRMACION',
  'PENDIENTE',
  'EN_COCINA',
  'LISTO',
];

function TrackingContent() {
  const params = useParams();
  const slug = params.slug as string;
  const token = params.token as string;
  const [data, setData] = useState<PublicOrderTracking | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await trackPublicOrder(token);
      setData(result);
      setError('');
    } catch {
      setError('No encontramos este pedido. Revisa el enlace o contacta al local.');
    }
  }, [token]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      void load();
    }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) {
    return (
      <Card className="max-w-md w-full text-center" padding="lg">
        <p className="text-red-400 font-medium">{error}</p>
        <Link href={`/menu/${slug}`} className="inline-block mt-4">
          <Button variant="secondary">Volver al menú</Button>
        </Link>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="max-w-md w-full text-center" padding="lg">
        <p className="text-text-secondary font-medium">Cargando estado…</p>
      </Card>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(data.status);

  return (
    <Card className="max-w-md w-full text-center" padding="lg">
      <p className="text-sm font-bold text-primary uppercase tracking-wide mb-2">
        Seguimiento
      </p>
      <h1 className="text-2xl font-extrabold text-foreground mb-1">
        {formatOrderNumber(data.orderNumber)}
      </h1>
      <p className="text-sm text-text-secondary mb-4">
        Total: {formatPrice(data.total)}
      </p>

      <div
        className={`rounded-xl border px-4 py-4 mb-4 ${
          data.status === 'EN_COCINA' || data.status === 'LISTO'
            ? 'border-green-800/40 bg-green-950/30 text-green-100'
            : data.status === 'CANCELADO'
              ? 'border-red-800/40 bg-red-950/30 text-red-100'
              : 'border-amber-800/40 bg-amber-950/30 text-amber-100'
        }`}
      >
        <p className="font-extrabold text-lg">{data.message}</p>
        <p className="text-xs mt-2 opacity-80">
          Estado: {ORDER_STATUS_LABELS[data.status]}
        </p>
      </div>

      {isActive && (
        <p className="text-sm text-text-secondary mb-4">
          Esta página se actualiza sola. Puedes dejarla abierta.
        </p>
      )}

      <Link href={`/menu/${slug}`}>
        <Button variant="secondary" className="w-full sm:w-auto">
          {isActive ? 'Volver al menú' : 'Hacer otro pedido'}
        </Button>
      </Link>
    </Card>
  );
}

export default function PublicOrderTrackingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="max-w-md w-full text-center" padding="lg">
            <p className="text-text-secondary font-medium">Cargando…</p>
          </Card>
        }
      >
        <TrackingContent />
      </Suspense>
    </div>
  );
}
