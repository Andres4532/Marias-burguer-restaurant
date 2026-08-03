'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { getOrders, formatOrderNumber, formatTime } from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  getOrderSummary,
  type Order,
  type OrderStatus,
  type OrderType,
} from '@/types/orders';

const STATUS_FILTERS: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE_CONFIRMACION', label: 'Por confirmar' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'EN_COCINA', label: 'En cocina' },
  { value: 'LISTO', label: 'Listos' },
  { value: 'ENTREGADO', label: 'Entregados' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

const TYPE_FILTERS: Array<{ value: OrderType | ''; label: string }> = [
  { value: '', label: 'Todos los tipos' },
  { value: 'MESA', label: 'Mesa' },
  { value: 'PARA_LLEVAR', label: 'Para recojo' },
  { value: 'DELIVERY', label: 'Delivery' },
];

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<OrderType | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders(
        statusFilter || undefined,
        true,
        undefined,
        typeFilter || undefined,
      );
      setOrders(data);
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Pedidos del día"
        description="Pedidos registrados hoy"
        action={
          <Link href="/pos">
            <Button>+ Nuevo pedido</Button>
          </Link>
        }
      />

      <Card padding="sm" className="mb-4 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Tipo
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TYPE_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                active={typeFilter === f.value}
                onClick={() => setTypeFilter(f.value)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Estado
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                active={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-text-secondary">Cargando pedidos...</p>
        ) : error ? (
          <p className="p-6 text-red-600 font-medium">{error}</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-secondary font-medium">
              No hay pedidos para mostrar.
            </p>
            <Link
              href="/pos"
              className="text-primary text-sm font-bold mt-3 inline-block hover:underline"
            >
              Crear primer pedido
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const canCharge =
                (order.status === 'PENDIENTE' ||
                  order.status === 'PENDIENTE_CONFIRMACION' ||
                  order.status === 'EN_COCINA' ||
                  order.status === 'LISTO') &&
                !order.payment;

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-primary/[0.02] transition"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/pedidos/${order.id}`)}
                    className="flex flex-1 items-start sm:items-center justify-between min-w-0 text-left gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-foreground">
                          {formatOrderNumber(order.orderNumber)}
                        </span>
                        <StatusBadge status={order.status} />
                        {order.source === 'MENU_PUBLICO' && (
                          <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Menú público
                          </span>
                        )}
                        {order.type === 'DELIVERY' && (
                          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Delivery
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {ORDER_TYPE_LABELS[order.type]}
                        {' · '}
                        {getOrderSummary(order)}
                        {' · '}
                        {formatTime(order.createdAt)}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {order.items.length} producto(s)
                        {order.payment && (
                          <span className="text-green-600 font-semibold">
                            {' · '}
                            {PAYMENT_METHOD_LABELS[order.payment.method]}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-lg font-extrabold text-foreground">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5 font-bold">
                        Ver detalle →
                      </p>
                    </div>
                  </button>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    {canCharge && (
                      <Link href={`/cobro/${order.id}`}>
                        <Button className="w-full sm:w-auto">Cobrar →</Button>
                      </Link>
                    )}
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
