'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEntrantesAlerts } from './EntrantesAlertsProvider';

export function EntrantesAlertsBar() {
  const pathname = usePathname();
  const { live, newOrderCount, deliveryNewCount } = useEntrantesAlerts();

  if (pathname.startsWith('/entrantes') || pathname.startsWith('/delivery') || pathname.startsWith('/mesas')) {
    return null;
  }

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
        {live ? 'Pedidos en vivo' : 'Reconectando...'}
      </span>

      {deliveryNewCount > 0 && (
        <Link
          href="/delivery"
          className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full hover:bg-indigo-200/80 transition"
        >
          {deliveryNewCount} delivery nuevo(s) →
        </Link>
      )}

      {newOrderCount > 0 && (
        <Link
          href="/entrantes"
          className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/15 transition"
        >
          {newOrderCount} recojo(s) nuevo(s) →
        </Link>
      )}
    </div>
  );
}
