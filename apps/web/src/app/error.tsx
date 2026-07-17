'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        <h1 className="text-xl font-bold text-foreground mb-2">
          Algo salió mal
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Ocurrió un error al cargar esta página.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </Card>
    </div>
  );
}
