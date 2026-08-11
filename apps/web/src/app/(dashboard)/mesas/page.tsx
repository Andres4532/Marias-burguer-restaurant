'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/orders/StatusBadge';
import {
  getMesaOrders,
  updateOrderStatus,
  formatOrderNumber,
  formatTime,
} from '@/lib/orders';
import { subscribeEntrantesStream } from '@/lib/entrantes-stream';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  getMesaWorkflowStep,
  isMesaOrderFinished,
  sortMesaOrders,
} from '@/lib/mesa-workflow';
import {
  canEditOrder,
  getOrderSummary,
  type Order,
} from '@/types/orders';

export default function MesasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const knownIds = useRef(new Set<string>());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = sortMesaOrders(await getMesaOrders());
      data.forEach((order) => knownIds.current.add(order.id));
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
  }, [load]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => document.removeEventListener('visibilitychange', refreshOnReturn);
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const connect = async () => {
      try {
        setLive(true);
        await subscribeEntrantesStream((event) => {
          if (event.type === 'ping') return;

          if (event.type === 'new_order' && event.order) {
            const { order } = event;
            if (order.type !== 'MESA' || order.source !== 'CAJA') return;

            const isNew = !knownIds.current.has(order.id);
            knownIds.current.add(order.id);
            if (isNew) {
              load(true);
            }
          }
        }, controller.signal);
      } catch {
        if (active) {
          setLive(false);
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      active = false;
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [load]);

  const handleAdvanceStatus = async (order: Order) => {
    const { nextStatus } = getMesaWorkflowStep(order);
    if (!nextStatus) return;

    setBusyId(order.id);
    setError('');
    try {
      await updateOrderStatus(order.id, nextStatus);
      await load(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mesas"
        description="Pedidos de mesa del POS · hoy"
        action={
          <div className="flex gap-2 flex-wrap">
            <Link href="/pos">
              <Button>+ Nuevo pedido</Button>
            </Link>
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
          Pendientes y en cocina arriba · terminados abajo
        </span>
      </div>

      {error && (
        <p className="mb-4 text-red-600 font-medium">{error}</p>
      )}

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-text-secondary">Cargando mesas...</p>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-text-secondary font-medium">
              No hay pedidos de mesa hoy.
            </p>
            <p className="text-sm text-text-secondary/80 mt-2">
              Creá uno desde el POS y aparecerá aquí al instante
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => {
              const finished = isMesaOrderFinished(order);
              const workflow = getMesaWorkflowStep(order);

              return (
                <div
                  key={order.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition ${
                    finished
                      ? 'opacity-60 bg-muted/30'
                      : 'hover:bg-primary/[0.02]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-foreground text-lg">
                        {formatOrderNumber(order.orderNumber)}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        Mesa
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1 font-semibold">
                      {getOrderSummary(order)}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {formatTime(order.createdAt)} · {order.items.length}{' '}
                      producto(s)
                      {order.payment && ' · Pagado'}
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
                    <p className="text-xl font-extrabold text-foreground sm:text-right">
                      {formatPrice(order.total)}
                    </p>
                    <div className="flex flex-row flex-wrap items-center justify-end gap-2">
                      {workflow.action === 'charge' && (
                        <Link
                          href={`/cobro/${order.id}?from=mesas`}
                          className="inline-flex"
                        >
                          <Button size="md">Cobrar →</Button>
                        </Link>
                      )}
                      {workflow.action === 'ready' && (
                        <Button
                          variant="success"
                          size="md"
                          disabled={busyId === order.id}
                          onClick={() => void handleAdvanceStatus(order)}
                        >
                          {busyId === order.id ? 'Guardando…' : workflow.actionLabel}
                        </Button>
                      )}
                      {workflow.action === 'deliver' && (
                        <Button
                          variant="success"
                          size="md"
                          disabled={busyId === order.id}
                          onClick={() => void handleAdvanceStatus(order)}
                        >
                          {busyId === order.id ? 'Guardando…' : workflow.actionLabel}
                        </Button>
                      )}
                      {canEditOrder(order) && (
                        <Link
                          href={`/pedidos/${order.id}/editar`}
                          className="inline-flex"
                        >
                          <Button variant="secondary" size="md">
                            Editar
                          </Button>
                        </Link>
                      )}
                      <Link href={`/pedidos/${order.id}`} className="inline-flex">
                        <Button variant="secondary" size="md">
                          Ver detalle
                        </Button>
                      </Link>
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
