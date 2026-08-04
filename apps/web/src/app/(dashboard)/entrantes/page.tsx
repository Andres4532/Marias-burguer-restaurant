'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { DeliveryHandoffButtons } from '@/components/orders/DeliveryHandoffButtons';
import { useEntrantesAlerts } from '@/components/entrantes/EntrantesAlertsProvider';
import { getEntrantesOrders, confirmPublicOrder, formatOrderNumber, formatTime } from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  notifyCustomerByWhatsApp,
} from '@/lib/customer-notify';
import { getSettings } from '@/lib/settings';
import {
  ORDER_TYPE_LABELS,
  getOrderSummary,
  canChargeOrder,
  type Order,
} from '@/types/orders';

export default function EntrantesPage() {
  const { live, alertsEnabled, newOrderCount, enableAlerts, resetNewOrderCount } =
    useEntrantesAlerts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');

  useEffect(() => {
    getSettings()
      .then((settings) => setRestaurantName(settings.name))
      .catch(() => {});
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getEntrantesOrders();
      data.sort((a, b) => {
        const aPending = a.status === 'PENDIENTE_CONFIRMACION' ? 1 : 0;
        const bPending = b.status === 'PENDIENTE_CONFIRMACION' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(data);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    resetNewOrderCount();
  }, [load, resetNewOrderCount]);

  useEffect(() => {
    if (newOrderCount > 0) {
      load(true);
    }
  }, [newOrderCount, load]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => document.removeEventListener('visibilitychange', refreshOnReturn);
  }, [load]);

  const handleConfirm = async (order: Order) => {
    setConfirmingId(order.id);
    setError('');
    try {
      await confirmPublicOrder(order.id);
      await load(true);
      notifyCustomerByWhatsApp(
        'COOKING',
        order.customerPhone,
        order.orderNumber,
        restaurantName,
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Entrantes"
        description="Pedidos del menú público en tiempo real"
        action={
          <div className="flex gap-2 flex-wrap">
            {!alertsEnabled && (
              <Button variant="secondary" onClick={() => void enableAlerts()}>
                Activar avisos
              </Button>
            )}
            <Button variant="secondary" onClick={() => load()}>
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
            live
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              live ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`}
          />
          {live ? 'En vivo' : 'Reconectando...'}
        </span>
        <span className="text-xs text-text-secondary">
          {alertsEnabled
            ? 'Sonido + notificaciones activos'
            : 'Toca la pantalla o activa avisos para escuchar pedidos'}
        </span>
      </div>

      <Card
        padding="sm"
        className="mb-4 bg-primary/5 border-primary/10 text-sm text-foreground"
      >
        Los clientes piden desde el menú público. El pedido permanece aquí hasta
        que lo cobres. Confírmalo para cocina, avisa por WhatsApp y luego cobra.
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-text-secondary">Cargando entrantes...</p>
        ) : error ? (
          <p className="p-6 text-red-600 font-medium">{error}</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-secondary font-medium">
              No hay pedidos entrantes por ahora.
            </p>
            <p className="text-sm text-text-secondary/80 mt-2">
              Te avisaremos al instante cuando llegue uno
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const canCharge = canChargeOrder(order);
              const needsConfirm = order.status === 'PENDIENTE_CONFIRMACION';

              return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 hover:bg-primary/[0.02] transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-foreground text-lg">
                      {formatOrderNumber(order.orderNumber)}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
                      Menú público
                    </span>
                    {order.type === 'DELIVERY' && (
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                        Delivery
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-1 font-semibold">
                    {getOrderSummary(order)}
                    {order.customerPhone && (
                      <span className="text-text-secondary font-normal">
                        {' '}
                        · {order.customerPhone}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {ORDER_TYPE_LABELS[order.type]} · {formatTime(order.createdAt)}{' '}
                    · {order.items.length} producto(s)
                  </p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
                  <p className="text-xl font-extrabold text-foreground sm:text-right">
                    {formatPrice(order.total)}
                  </p>
                  <div className="flex flex-row flex-wrap items-center justify-end gap-2">
                    {order.type === 'DELIVERY' && (
                      <DeliveryHandoffButtons order={order} layout="row" />
                    )}
                    {needsConfirm ? (
                      <Button
                        variant="success"
                        size="md"
                        disabled={confirmingId === order.id}
                        onClick={() => void handleConfirm(order)}
                      >
                        {confirmingId === order.id
                          ? 'Confirmando…'
                          : 'Confirmar → cocina'}
                      </Button>
                    ) : (
                      <Button variant="secondary" size="md" disabled>
                        En cocina
                      </Button>
                    )}
                    <Link href={`/pedidos/${order.id}`} className="inline-flex">
                      <Button variant="secondary" size="md">
                        Ver detalle
                      </Button>
                    </Link>
                    {canCharge ? (
                      <Link href={`/cobro/${order.id}`} className="inline-flex">
                        <Button size="md">Cobrar →</Button>
                      </Link>
                    ) : (
                      <Button
                        size="md"
                        disabled
                        title="Confirma el pedido para cocina primero"
                      >
                        Cobrar →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
