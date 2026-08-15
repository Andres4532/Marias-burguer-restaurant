'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { KitchenTicketPrintSet, printKitchenTicket } from '@/components/kitchen-ticket/KitchenTicket';
import { TicketPrintHint } from '@/components/kitchen-ticket/TicketPrintHint';
import { TicketPreviewModal } from '@/components/kitchen-ticket/TicketPreviewModal';
import { getOrder, payOrder, formatOrderNumber } from '@/lib/orders';
import { formatPrice, getErrorMessage } from '@/lib/catalog';
import { formatOrderItemSauces } from '@/lib/sauce-labels';
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  getOrderSummary,
  type Order,
  type PaymentMethod,
} from '@/types/orders';

const PAYMENT_METHODS: PaymentMethod[] = ['EFECTIVO', 'QR'];

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
  EFECTIVO: '💵',
  QR: '📱',
  TARJETA: '💳',
};

function parseCashAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function suggestCashAmounts(total: number): number[] {
  const suggestions = new Set<number>([total]);
  const bills = [10, 20, 50, 100, 200];
  for (const bill of bills) {
    const rounded = Math.ceil(total / bill) * bill;
    if (rounded >= total) suggestions.add(rounded);
  }
  return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);
}

export default function CobroPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDeliveryPanel = searchParams.get('from') === 'delivery';
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState<number | null>(null);
  const [amountReceivedPaid, setAmountReceivedPaid] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [wantsBilling, setWantsBilling] = useState(false);
  const [billingNit, setBillingNit] = useState('');
  const [billingBusinessName, setBillingBusinessName] = useState('');
  const [billingComplement, setBillingComplement] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrder(id);
      setOrder(data);
      if (data.payment || !['PENDIENTE', 'PENDIENTE_CONFIRMACION', 'EN_COCINA', 'LISTO'].includes(data.status)) {
        setPaid(true);
        if (data.payment?.method === 'EFECTIVO') {
          setAmountReceivedPaid(data.payment.amountReceived ?? null);
          setChange(data.payment.changeAmount ?? null);
        }
      } else {
        setAmountReceived(String(data.total));
      }
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

  const cashSuggestions = useMemo(
    () => (order ? suggestCashAmounts(order.total) : []),
    [order],
  );

  const cashReceived = useMemo(
    () => parseCashAmount(amountReceived),
    [amountReceived],
  );

  const computedChange = useMemo(() => {
    if (method !== 'EFECTIVO' || !order || cashReceived == null) return null;
    return Math.round((cashReceived - order.total) * 100) / 100;
  }, [method, cashReceived, order]);

  const cashIsValid =
    method !== 'EFECTIVO' ||
    (cashReceived != null && cashReceived >= (order?.total ?? 0));

  const cashIsInsufficient =
    method === 'EFECTIVO' &&
    cashReceived != null &&
    order != null &&
    cashReceived < order.total;

  const handlePay = async () => {
    setError('');

    if (method === 'EFECTIVO') {
      if (cashReceived == null || cashReceived < (order?.total ?? 0)) {
        setError('El monto recibido debe ser mayor o igual al total');
        return;
      }
    }

    if (wantsBilling) {
      if (!billingNit.trim()) {
        setError('Ingrese el NIT');
        return;
      }
      if (!billingBusinessName.trim()) {
        setError('Ingrese la razón social o nombre');
        return;
      }
    }

    setPaying(true);
    try {
      const result = await payOrder(
        id,
        method,
        method === 'EFECTIVO' ? cashReceived ?? undefined : undefined,
        wantsBilling
          ? {
              billingNit,
              billingBusinessName,
              billingComplement,
            }
          : undefined,
      );
      const refreshed = await getOrder(id);
      setOrder(refreshed ?? result.order);
      setChange(result.change ?? result.order.payment?.changeAmount ?? null);
      setAmountReceivedPaid(
        result.amountReceived ?? result.order.payment?.amountReceived ?? null,
      );
      setPaid(true);
      setTimeout(() => printKitchenTicket(), 500);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <p className="text-text-secondary py-12 text-center font-medium">
        Cargando cobro...
      </p>
    );
  }

  if (error && !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-300 font-medium">{error}</p>
        <Link
          href="/pedidos"
          className="text-primary text-sm font-bold mt-3 inline-block hover:underline"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const summary = getOrderSummary(order);
  const needsKitchenConfirm = order.status === 'PENDIENTE_CONFIRMACION';
  const isDeliveryOrder = order.type === 'DELIVERY' || fromDeliveryPanel;

  const billingBlock = order.payment?.billingNit ? (
    <div className="rounded-xl border border-border bg-background p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">
        Datos de factura
      </p>
      <p className="font-bold text-foreground">
        {order.payment.billingBusinessName}
      </p>
      <p className="text-text-secondary mt-1">
        NIT: {order.payment.billingNit}
        {order.payment.billingComplement
          ? ` · ${order.payment.billingComplement}`
          : ''}
      </p>
    </div>
  ) : null;

  return (
    <>
      <div>
        <PageHeader
          title={`Cobrar ${formatOrderNumber(order.orderNumber)}`}
          description={`${ORDER_TYPE_LABELS[order.type]} · ${summary}`}
          action={
            <Link href={`/pedidos/${id}`}>
              <Button variant="secondary">← Volver</Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <StatusBadge status={order.status} />
              {order.payment && (
                <span className="text-xs font-bold text-green-300 bg-green-950/40 border border-green-800/50 px-2.5 py-1 rounded-full">
                  Pagado · {PAYMENT_METHOD_LABELS[order.payment.method]}
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-foreground mb-3">Resumen del pedido</h3>
            <div className="space-y-3 mb-5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start gap-3 text-sm border-b border-border pb-3 last:border-0"
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
                    {(() => {
                      const sauceLine = formatOrderItemSauces(item);
                      return sauceLine ? (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Salsa: {sauceLine}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <span className="font-extrabold text-foreground shrink-0">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-sm text-foreground bg-background border border-border rounded-xl p-3 mb-5">
                <span className="font-bold">Notas:</span> {order.notes}
              </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <span className="text-lg font-extrabold text-foreground">
                Total a cobrar
              </span>
              <span className="text-3xl font-extrabold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </Card>

          <Card padding="lg">
            {paid ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-800/50 bg-green-950/30 p-6 text-center">
                  <p className="text-green-800 font-extrabold text-xl">
                    Cobro registrado
                  </p>
                  {order.payment && (
                    <p className="text-green-300 text-sm mt-2 font-medium">
                      {PAYMENT_METHOD_LABELS[order.payment.method]} ·{' '}
                      {formatPrice(order.payment.amount)}
                    </p>
                  )}
                  {order.payment?.method === 'EFECTIVO' &&
                    amountReceivedPaid != null && (
                      <div className="mt-4 rounded-xl border border-green-800/40 bg-green-950/20 p-4 text-left space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Recibido</span>
                          <span className="font-bold text-foreground">
                            {formatPrice(amountReceivedPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Total</span>
                          <span className="font-bold text-foreground">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-green-800/30">
                          <span className="font-bold text-green-800">Vuelto</span>
                          <span className="text-2xl font-extrabold text-green-800">
                            {formatPrice(change ?? 0)}
                          </span>
                        </div>
                        {(change ?? 0) === 0 && (
                          <p className="text-xs text-green-700 font-medium">
                            Pago exacto — sin vuelto
                          </p>
                        )}
                      </div>
                    )}
                  {order.payment?.method !== 'EFECTIVO' && change != null && change > 0 && (
                    <p className="text-green-800 font-extrabold text-2xl mt-3">
                      Vuelto: {formatPrice(change)}
                    </p>
                  )}
                  {billingBlock && <div className="mt-4 text-left">{billingBlock}</div>}
                  <p className="text-green-600 text-xs mt-3 font-bold">
                    {isDeliveryOrder
                      ? 'Cobro registrado. Continúa en Delivery.'
                      : order.status === 'PENDIENTE'
                        ? 'Pedido enviado a cocina'
                        : 'Cobro registrado correctamente'}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  onClick={() => setPreviewOpen(true)}
                  className="w-full"
                >
                  Vista previa del ticket
                </Button>

                <Button onClick={printKitchenTicket} className="w-full" size="lg">
                  Imprimir ticket de cocina
                </Button>

                <TicketPrintHint />

                {isDeliveryOrder ? (
                  <Button
                    onClick={() => router.push('/delivery')}
                    className="w-full"
                    size="lg"
                  >
                    Volver a Delivery
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/pedidos/${id}`)}
                    className="w-full"
                  >
                    Ver detalle del pedido
                  </Button>
                )}
              </div>
            ) : needsKitchenConfirm ? (
              <div className="space-y-4 py-6 text-center">
                <p className="font-extrabold text-foreground text-lg">
                  Confirma cocina primero
                </p>
                <p className="text-sm text-text-secondary">
                  {isDeliveryOrder
                    ? 'Confírmalo primero en la pantalla Delivery y luego podrás cobrar.'
                    : 'Este pedido del menú público aún no fue enviado a cocina. Confírmalo en Recojo y luego podrás cobrar.'}
                </p>
                <Link
                  href={isDeliveryOrder ? '/delivery' : '/entrantes'}
                  className="inline-flex"
                >
                  <Button variant="success" size="lg">
                    {isDeliveryOrder ? 'Ir a Delivery' : 'Ir a Recojo'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="font-extrabold text-foreground mb-3">
                    Método de pago
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`py-4 px-2 rounded-xl text-xs sm:text-sm font-bold transition border-2 active:scale-95 ${
                          method === m
                            ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10'
                            : 'border-border bg-card text-text-secondary hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        <span className="block text-2xl mb-1">{PAYMENT_ICONS[m]}</span>
                        {PAYMENT_METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'EFECTIVO' && (
                  <div className="space-y-3">
                    <Input
                      label="Monto recibido (Bs.)"
                      type="number"
                      min={order.total}
                      step="0.5"
                      inputMode="decimal"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                    />

                    <div>
                      <p className="text-xs font-bold text-text-secondary mb-2">
                        Montos sugeridos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cashSuggestions.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setAmountReceived(String(amount))}
                            className="px-3 py-2 text-sm font-bold rounded-full bg-background border border-border hover:border-primary/30 hover:bg-primary/[0.03] text-foreground transition"
                          >
                            {formatPrice(amount)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {cashIsInsufficient && (
                      <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl font-medium">
                        Falta {formatPrice(order.total - (cashReceived ?? 0))} para
                        completar el cobro
                      </p>
                    )}

                    {cashIsValid && computedChange != null && (
                      <Card
                        padding="sm"
                        className={
                          computedChange === 0
                            ? 'bg-green-950/30 border-green-800/50'
                            : 'bg-blue-950/30 border-blue-800/50'
                        }
                      >
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <p className="text-text-secondary font-bold">Total</p>
                            <p className="font-extrabold text-foreground mt-1">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary font-bold">Recibido</p>
                            <p className="font-extrabold text-foreground mt-1">
                              {formatPrice(cashReceived ?? 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-secondary font-bold">Vuelto</p>
                            <p
                              className={`font-extrabold text-xl mt-1 ${
                                computedChange === 0
                                  ? 'text-green-800'
                                  : 'text-blue-800'
                              }`}
                            >
                              {formatPrice(Math.max(0, computedChange))}
                            </p>
                          </div>
                        </div>
                        {computedChange === 0 && (
                          <p className="text-center text-xs text-green-700 font-medium mt-2">
                            Pago exacto — sin vuelto
                          </p>
                        )}
                      </Card>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={wantsBilling}
                      onChange={(e) => {
                        setWantsBilling(e.target.checked);
                        if (!e.target.checked) {
                          setBillingNit('');
                          setBillingBusinessName('');
                          setBillingComplement('');
                        }
                      }}
                      className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        Factura con NIT (opcional)
                      </span>
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        Si no la marcas, se cobra como consumidor final.
                      </span>
                    </span>
                  </label>

                  {wantsBilling && (
                    <div className="space-y-3 border-t border-border pt-3">
                      <Input
                        label="NIT"
                        value={billingNit}
                        onChange={(e) => setBillingNit(e.target.value)}
                        placeholder="Ej: 123456789"
                        autoComplete="off"
                      />
                      <Input
                        label="Razón social / nombre"
                        value={billingBusinessName}
                        onChange={(e) => setBillingBusinessName(e.target.value)}
                        placeholder="Nombre o empresa"
                        autoComplete="organization"
                      />
                      <Input
                        label="Complemento (opcional)"
                        value={billingComplement}
                        onChange={(e) => setBillingComplement(e.target.value)}
                        placeholder="Ej: 1A"
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl font-medium">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handlePay}
                  disabled={paying || !cashIsValid}
                  size="lg"
                  className="w-full"
                >
                  {paying
                    ? 'Procesando...'
                    : method === 'EFECTIVO' &&
                        cashIsValid &&
                        computedChange != null &&
                        computedChange > 0
                      ? `Confirmar cobro · Vuelto ${formatPrice(computedChange)}`
                      : `Confirmar cobro · ${formatPrice(order.total)}`}
                </Button>
              </div>
            )}
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
