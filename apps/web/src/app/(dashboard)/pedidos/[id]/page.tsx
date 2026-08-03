'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { DeliveryMapLinks } from '@/components/orders/DeliveryMapLinks';
import { DeliveryHandoffButtons } from '@/components/orders/DeliveryHandoffButtons';
import { KitchenTicket, printKitchenTicket } from '@/components/kitchen-ticket/KitchenTicket';
import { TicketPreviewModal } from '@/components/kitchen-ticket/TicketPreviewModal';
import {
  getOrder,
  updateOrderStatus,
  formatOrderNumber,
  formatTime,
} from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  ORDER_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getOrderSummary,
  type Order,
  type OrderStatus,
} from '@/types/orders';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  EN_COCINA: 'LISTO',
  LISTO: 'ENTREGADO',
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  EN_COCINA: 'Marcar listo',
  LISTO: 'Marcar entregado',
};

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrder(await getOrder(id));
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrder(updated);
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Cancelar este pedido?')) return;
    await handleStatusChange('CANCELADO');
  };

  if (loading) {
    return (
      <p className="text-text-secondary py-12 text-center font-medium">
        Cargando pedido...
      </p>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{error || 'Pedido no encontrado'}</p>
        <Link
          href="/pedidos"
          className="text-primary text-sm font-bold mt-3 inline-block hover:underline"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[order.status];
  const isPaid = !!order.payment;

  return (
    <>
      <div>
        <PageHeader
          title={formatOrderNumber(order.orderNumber)}
          description={`${ORDER_TYPE_LABELS[order.type]} · ${getOrderSummary(order)} · ${formatTime(order.createdAt)}`}
          action={
            <Link href="/pedidos">
              <Button variant="secondary">← Volver</Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" padding="lg">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <StatusBadge status={order.status} />
              <span className="text-sm text-text-secondary font-medium">
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              {order.payment && (
                <span className="text-xs font-bold text-green-300 bg-green-950/40 border border-green-800/50 px-2.5 py-1 rounded-full">
                  {PAYMENT_METHOD_LABELS[order.payment.method]} ·{' '}
                  {formatPrice(order.payment.amount)}
                </span>
              )}
            </div>

            {order.type === 'DELIVERY' && (
              <Card
                padding="sm"
                className="mb-5 bg-indigo-50 border-indigo-100 text-sm space-y-1"
              >
                <p className="font-extrabold text-indigo-900">Datos de entrega</p>
                {order.customerName && (
                  <p>
                    <span className="text-text-secondary">Cliente:</span>{' '}
                    {order.customerName}
                  </p>
                )}
                {order.customerPhone && (
                  <p>
                    <span className="text-text-secondary">Teléfono:</span>{' '}
                    {order.customerPhone}
                  </p>
                )}
                {order.deliveryAddress && (
                  <p>
                    <span className="text-text-secondary">Dirección:</span>{' '}
                    {order.deliveryAddress}
                  </p>
                )}
                {order.deliveryReference && (
                  <p>
                    <span className="text-text-secondary">Referencia:</span>{' '}
                    {order.deliveryReference}
                  </p>
                )}
                <DeliveryMapLinks
                  latitude={order.deliveryLatitude}
                  longitude={order.deliveryLongitude}
                />
              </Card>
            )}

            {order.payment?.billingNit && (
              <Card padding="sm" className="mb-5 bg-background border-border text-sm">
                <p className="font-extrabold text-foreground mb-1">
                  Datos de factura
                </p>
                <p className="font-medium text-foreground">
                  {order.payment.billingBusinessName}
                </p>
                <p className="text-text-secondary mt-0.5">
                  NIT: {order.payment.billingNit}
                  {order.payment.billingComplement
                    ? ` · ${order.payment.billingComplement}`
                    : ''}
                </p>
              </Card>
            )}

            <h3 className="font-extrabold text-foreground mb-3">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="font-bold text-foreground">
                      {item.quantity}× {item.productName}
                    </p>
                    {item.extras.length > 0 && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.extras.map((e) => e.extraName).join(' · ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-primary mt-0.5 font-medium">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-extrabold text-foreground text-sm">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-sm text-foreground mt-4 bg-background border border-border p-3 rounded-xl">
                <strong>Notas:</strong> {order.notes}
              </p>
            )}

            <div className="flex justify-between items-center mt-5 pt-4 border-t border-border">
              <span className="font-extrabold text-foreground">Total</span>
              <span className="text-2xl font-extrabold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </Card>

          <Card className="h-fit" padding="lg">
            <h3 className="font-extrabold text-foreground mb-4">Acciones</h3>
            <div className="flex flex-col gap-4">
              {order.type === 'DELIVERY' &&
                order.status !== 'CANCELADO' && (
                  <DeliveryHandoffButtons order={order} />
                )}

              {(order.status === 'PENDIENTE' ||
                order.status === 'PENDIENTE_CONFIRMACION' ||
                order.status === 'EN_COCINA' ||
                order.status === 'LISTO') &&
                !isPaid && (
                <Link href={`/cobro/${id}`} className="block w-full">
                  <Button className="w-full" size="lg">
                    Cobrar pedido
                  </Button>
                </Link>
              )}

              {isPaid && order.status !== 'CANCELADO' && order.status !== 'ENTREGADO' && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setPreviewOpen(true)}
                    className="w-full"
                  >
                    Vista previa del ticket
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={printKitchenTicket}
                    className="w-full"
                  >
                    Imprimir ticket cocina
                  </Button>
                </>
              )}

              {nextStatus && (
                <Button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? 'Actualizando...' : NEXT_STATUS_LABEL[order.status]}
                </Button>
              )}

              {order.status !== 'CANCELADO' && order.status !== 'ENTREGADO' && (
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={updating}
                  className="w-full"
                >
                  Cancelar pedido
                </Button>
              )}

              {order.createdBy && (
                <p className="text-xs text-text-secondary pt-2">
                  Creado por: {order.createdBy.name}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="kitchen-ticket-print-area">
        <KitchenTicket order={order} />
      </div>

      <TicketPreviewModal
        order={order}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
