'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/catalog';
import { formatOrderNumber } from '@/lib/orders';

function SuccessIcon() {
  return (
    <div className="mx-auto size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5 border border-green-200">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        className="size-8"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
}

function PublicMenuSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderNumber = Number(searchParams.get('n') || 0);
  const total = Number(searchParams.get('total') || 0);

  return (
    <Card className="max-w-md w-full text-center" padding="lg">
      <SuccessIcon />
      <h1 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">
        ¡Pedido enviado!
      </h1>
      <p className="text-text-secondary mb-6 leading-relaxed">
        Tu pedido{' '}
        <span className="font-bold text-foreground">
          {orderNumber ? formatOrderNumber(orderNumber) : ''}
        </span>{' '}
        fue recibido. Acércate a caja para pagar
        {total > 0 && (
          <>
            {' '}
            (
            <span className="font-bold text-primary">
              {formatPrice(total)}
            </span>
            )
          </>
        )}
        .
      </p>
      <p className="text-sm text-text-secondary mb-6">
        Conserva tu número de pedido. Te llamaremos cuando esté listo.
      </p>
      <Link href={`/menu/${slug}`}>
        <Button className="w-full sm:w-auto">Hacer otro pedido</Button>
      </Link>
    </Card>
  );
}

export default function PublicMenuSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="max-w-md w-full text-center" padding="lg">
            <p className="text-text-secondary font-medium">Cargando…</p>
          </Card>
        }
      >
        <PublicMenuSuccessContent />
      </Suspense>
    </div>
  );
}
