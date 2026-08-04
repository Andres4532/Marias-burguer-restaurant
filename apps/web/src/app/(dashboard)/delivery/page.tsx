'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DeliveryOrderCard } from '@/components/delivery/DeliveryOrderCard';
import { useEntrantesAlerts } from '@/components/entrantes/EntrantesAlertsProvider';
import {
  confirmPublicOrder,
  getOrders,
  updateOrderStatus,
} from '@/lib/orders';
import { getErrorMessage } from '@/lib/catalog';
import {
  countActiveDeliveryOrders,
  getDeliveryWorkflowStep,
  groupDeliveryOrders,
} from '@/lib/delivery-workflow';
import { notifyCustomerByWhatsApp } from '@/lib/customer-notify';
import { getSettings } from '@/lib/settings';
import type { Order } from '@/types/orders';

const SECTION_META = [
  { key: 'confirm' as const, title: '1. Nuevos', emoji: '🆕' },
  { key: 'charge' as const, title: '2. Por cobrar', emoji: '💳' },
  { key: 'dispatch' as const, title: '3. En cocina', emoji: '👨‍🍳' },
  { key: 'deliver' as const, title: '4. En camino', emoji: '🛵' },
];

export default function DeliveryPage() {
  const router = useRouter();
  const { live, newOrderCount, resetNewOrderCount } = useEntrantesAlerts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');

  useEffect(() => {
    getSettings()
      .then((settings) => setRestaurantName(settings.name))
      .catch(() => {});
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getOrders(undefined, true, undefined, 'DELIVERY');
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

  const handleAction = async (order: Order) => {
    const { action } = getDeliveryWorkflowStep(order);
    setBusyId(order.id);
    setError('');

    try {
      if (action === 'confirm') {
        await confirmPublicOrder(order.id);
        notifyCustomerByWhatsApp(
          'COOKING',
          order.customerPhone,
          order.orderNumber,
          restaurantName,
        );
      } else if (action === 'charge') {
        router.push(`/cobro/${order.id}?from=delivery`);
        return;
      } else if (action === 'dispatch') {
        await updateOrderStatus(order.id, 'LISTO');
        notifyCustomerByWhatsApp(
          'ON_THE_WAY',
          order.customerPhone,
          order.orderNumber,
          restaurantName,
        );
      } else if (action === 'deliver') {
        await updateOrderStatus(order.id, 'ENTREGADO');
      }

      await load(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const sections = groupDeliveryOrders(orders);
  const activeCount = countActiveDeliveryOrders(orders);

  return (
    <div>
      <PageHeader
        title="Delivery"
        description="Control de pedidos a domicilio — un paso a la vez"
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
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">
          {activeCount} activo(s) hoy
        </span>
      </div>

      <Card
        padding="sm"
        className="mb-4 bg-indigo-50/80 border-indigo-200/60 text-sm text-foreground"
      >
        Sigue los pasos en orden:{' '}
        <strong>Confirmar → Cobrar → En camino → Entregado</strong>. Cada pedido
        tiene un solo botón principal. Los recojos del menú público están en{' '}
        <strong>Recojo</strong>.
      </Card>

      {error && (
        <Card padding="sm" className="mb-4 border-red-300 bg-red-50">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card>
          <p className="text-text-secondary">Cargando delivery...</p>
        </Card>
      ) : activeCount === 0 ? (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3">🛵</p>
          <p className="font-bold text-foreground">No hay delivery activo</p>
          <p className="text-sm text-text-secondary mt-2">
            Los nuevos pedidos delivery aparecerán aquí automáticamente
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {SECTION_META.map(({ key, title, emoji }) => {
            const items = sections[key];
            if (items.length === 0) return null;

            return (
              <section key={key}>
                <h2 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                  <span>{emoji}</span>
                  {title}
                  <span className="text-xs font-bold text-text-secondary bg-background border border-border px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((order) => (
                    <DeliveryOrderCard
                      key={order.id}
                      order={order}
                      busy={busyId === order.id}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
