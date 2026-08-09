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
import { KitchenTicketPrintSet, printKitchenTicket } from '@/components/kitchen-ticket/KitchenTicket';
import { TicketPrintHint } from '@/components/kitchen-ticket/TicketPrintHint';
import { TicketPreviewModal } from '@/components/kitchen-ticket/TicketPreviewModal';
import {
  getOrder,
  updateOrderStatus,
  formatOrderNumber,
  formatTime,
} from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import { formatCartSauceLine } from '@/lib/sauce-labels';
import { normalizeMediaUrl } from '@/lib/media-url';
import {
  ORDER_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  getOrderSummary,
  canEditOrder,
  canCancelOrder,
  canChargeOrder,
  isQrPublicOrder,
  type Order,
  type OrderStatus,
} from '@/types/orders';
import { useAuth } from '@/hooks/useAuth';
import { isJefa } from '@/lib/auth';
import { notifyCustomerByWhatsApp } from '@/lib/customer-notify';
import { getSettings } from '@/lib/settings';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  EN_COCINA: 'LISTO',
  LISTO: 'ENTREGADO',
};

function getNextStatusLabel(order: Order): string | undefined {
  if (order.status === 'EN_COCINA') {
    return order.type === 'DELIVERY'
      ? 'Marcar listo · avisar salida'
      : 'Marcar listo';
  }

  if (order.status === 'LISTO') {
    return 'Marcar entregado';
  }

  return undefined;
}

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');

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

  useEffect(() => {
    getSettings()
      .then((settings) => setRestaurantName(settings.name))
      .catch(() => {});
  }, []);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;

    setUpdating(true);
    try {
      const updated = await updateOrderStatus(id, status);
      setOrder(updated);

      if (
        status === 'LISTO' &&
        order.type === 'DELIVERY' &&
        order.customerPhone
      ) {
        notifyCustomerByWhatsApp(
          'ON_THE_WAY',
          order.customerPhone,
          order.orderNumber,
          restaurantName,
        );
      }
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
  const nextStatusLabel = getNextStatusLabel(order);
  const isPaid = !!order.payment;
  const userIsJefa = isJefa(user);
  const showCancel = canCancelOrder(order, userIsJefa);

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

            {order.payment?.method === 'EFECTIVO' &&
              order.payment.amountReceived != null && (
                <Card
                  padding="sm"
                  className="mb-5 bg-emerald-950/20 border-emerald-800/40 text-sm"
                >
                  <p className="font-extrabold text-emerald-100 mb-2">
                    Cobro en efectivo
                  </p>
                  <div className="flex justify-between gap-4">
                    <span className="text-text-secondary">Recibido</span>
                    <span className="font-bold text-foreground">
                      {formatPrice(order.payment.amountReceived)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 mt-1">
                    <span className="text-text-secondary">Vuelto</span>
                    <span className="font-extrabold text-emerald-200">
                      {formatPrice(order.payment.changeAmount ?? 0)}
                    </span>
                  </div>
                </Card>
              )}

            {isQrPublicOrder(order) && order.paymentProofUrl && (
              <Card padding="sm" className="mb-5 bg-blue-950/20 border-blue-800/40">
                <p className="font-extrabold text-blue-100 mb-3 text-sm">
                  Comprobante de pago QR
                </p>
                <a
                  href={normalizeMediaUrl(order.paymentProofUrl) ?? order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-border bg-background"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeMediaUrl(order.paymentProofUrl) ?? order.paymentProofUrl}
                    alt="Comprobante QR"
                    className="w-full max-h-80 object-contain bg-black/10"
                  />
                </a>
              </Card>
            )}

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
                    {item.sauces.length > 0 && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Salsa:{' '}
                        {item.sauces
                          .map((s) => formatCartSauceLine(s.sauceName, s.placement))
                          .join(' · ')}
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
              {canEditOrder(order) && (
                <Link href={`/pedidos/${id}/editar`} className="block w-full">
                  <Button variant="secondary" className="w-full" size="lg">
                    Editar pedido
                  </Button>
                </Link>
              )}

              {order.type === 'DELIVERY' &&
                order.status !== 'CANCELADO' && (
                  <DeliveryHandoffButtons order={order} />
                )}

              {canChargeOrder(order) && (
                <Link href={`/cobro/${id}`} className="block w-full">
                  <Button className="w-full" size="lg">
                    Cobrar pedido
                  </Button>
                </Link>
              )}

              {!isPaid && order.status === 'PENDIENTE_CONFIRMACION' && (
                <p className="text-xs text-text-secondary">
                  Confirma el pedido en Entrantes antes de cobrar.
                </p>
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
                  <TicketPrintHint />
                </>
              )}

              {nextStatus && nextStatusLabel && (
                <Button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? 'Actualizando...' : nextStatusLabel}
                </Button>
              )}

              {order.type === 'DELIVERY' &&
                order.status === 'EN_COCINA' &&
                order.customerPhone &&
                order.payment && (
                  <p className="text-xs text-text-secondary">
                    Al marcar listo se abrirá WhatsApp al cliente (
                    {order.customerPhone}) avisando que el repartidor salió.
                  </p>
                )}

              {order.type === 'DELIVERY' &&
                !order.payment &&
                order.status !== 'PENDIENTE_CONFIRMACION' &&
                order.status !== 'CANCELADO' && (
                  <p className="text-xs text-text-secondary">
                    Cobrá al repartidor cuando llegue, aunque cocina aún prepare
                    el pedido. Usá la pantalla Delivery.
                  </p>
                )}

              {showCancel && (
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={updating}
                  className="w-full"
                >
                  Cancelar pedido
                </Button>
              )}

              {!showCancel &&
                order.status !== 'CANCELADO' &&
                order.status !== 'ENTREGADO' &&
                !isPaid &&
                !userIsJefa && (
                  <p className="text-xs text-text-secondary">
                    Solo la jefa puede cancelar pedidos en cocina o por
                    confirmar.
                  </p>
                )}

              {isPaid && order.status !== 'CANCELADO' && (
                <p className="text-xs text-text-secondary">
                  Los pedidos cobrados no se pueden cancelar desde el sistema.
                </p>
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
        <KitchenTicketPrintSet order={order} />
      </div>

      <TicketPreviewModal
        order={order}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
