'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useEntrantesAlerts } from './EntrantesAlertsProvider';

export function EntrantesAlertsBar() {
  const pathname = usePathname();
  const { live, alertsEnabled, newOrderCount, enableAlerts } =
    useEntrantesAlerts();

  if (pathname.startsWith('/entrantes')) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
          live ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            live ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          }`}
        />
        {live ? 'Entrantes en vivo' : 'Reconectando entrantes...'}
      </span>

      {!alertsEnabled && (
        <Button variant="secondary" onClick={() => void enableAlerts()}>
          Activar avisos
        </Button>
      )}

      {newOrderCount > 0 && (
        <Link
          href="/entrantes"
          className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/15 transition"
        >
          {newOrderCount} pedido(s) nuevo(s) →
        </Link>
      )}
    </div>
  );
}
