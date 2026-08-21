'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { CancelOrderButton } from '@/components/orders/CancelOrderButton';
import { useEntrantesAlerts } from '@/components/entrantes/EntrantesAlertsProvider';
import { getEntrantesOrders, confirmPublicOrder, formatOrderNumber, formatTime } from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  notifyCustomerByWhatsApp,
} from '@/lib/customer-notify';
import { getSettings } from '@/lib/settings';
import {
  PaymentProofConfirmModal,
} from '@/components/orders/PaymentProofConfirmModal';
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  getOrderSummary,
  canChargeOrder,
  isQrPublicOrder,
  type Order,
} from '@/types/orders';
import { useAuth } from '@/hooks/useAuth';
import { isJefa } from '@/lib/auth';

export default function EntrantesPage() {
  const { user } = useAuth();
  const userIsJefa = isJefa(user);
  const { live, newOrderCount, resetRecojoNewCount } = useEntrantesAlerts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [proofReviewOrder, setProofReviewOrder] = useState<Order | null>(null);
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');

  useEffect(() => {
    getSettings()
      .then((settings) => setRestaurantName(settings.name))
      .catch(() => {});
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = (await getEntrantesOrders()).filter(
        (order) => order.type !== 'DELIVERY',
      );
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
    resetRecojoNewCount();
  }, [load, resetRecojoNewCount]);

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

  const runConfirm = async (order: Order) => {
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
      setProofReviewOrder(null);
    }
  };

  const handleConfirm = (order: Order) => {
    if (isQrPublicOrder(order) && order.paymentProofUrl) {
      setProofReviewOrder(order);
      return;
    }
    void runConfirm(order);
  };

  return (
    <div>
      <PageHeader
        title="Recojo entrante"
        description="Pedidos para recojo del menú público"
        action={
          <Button variant="secondary" onClick={() => load()}>
            Actualizar
          </Button>
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
          Avisos de sonido y notificación activos
        </span>
      </div>

      <Card
        padding="sm"
        className="mb-4 bg-primary/5 border-primary/10 text-sm text-foreground"
      >
        Pedidos <strong>para recojo</strong> del menú público. Los{' '}
        <strong>delivery</strong> se gestionan en la pantalla Delivery.
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-text-secondary">Cargando entrantes...</p>
        ) : error ? (
          <p className="p-6 text-red-600 font-medium">{error}</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-secondary font-medium">
              No hay recojos entrantes por ahora.
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
                    {isQrPublicOrder(order) && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                        {PAYMENT_METHOD_LABELS.QR}
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
                    {needsConfirm ? (
                      <Button
                        variant="success"
                        size="md"
                        disabled={confirmingId === order.id}
                        onClick={() => handleConfirm(order)}
                      >
                        {confirmingId === order.id
                          ? 'Confirmando…'
                          : isQrPublicOrder(order)
                            ? 'Ver comprobante QR'
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
                    ) : order.payment ? (
                      <Button size="md" disabled>
                        Pagado
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        disabled
                        title="Confirma el pedido para cocina primero"
                      >
                        Cobrar →
                      </Button>
                    )}
                    <CancelOrderButton
                      order={order}
                      isJefa={userIsJefa}
                      disabled={confirmingId === order.id}
                      size="md"
                      className="inline-flex"
                      onCancelled={() => load(true)}
                    />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </Card>

      {proofReviewOrder?.paymentProofUrl && (
        <PaymentProofConfirmModal
          open
          proofUrl={proofReviewOrder.paymentProofUrl}
          total={proofReviewOrder.total}
          confirming={confirmingId === proofReviewOrder.id}
          onClose={() => setProofReviewOrder(null)}
          onConfirm={() => void runConfirm(proofReviewOrder)}
        />
      )}
    </div>
  );
}
