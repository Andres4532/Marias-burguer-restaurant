import { apiFetch } from './api-client';
import { getToken } from './auth';
import type { Order, CreateOrderInput, UpdateMesaOrderInput, OrderStatus, PaymentMethod, OrderSource, OrderType, PayOrderBillingInput, Payment } from '@/types/orders';

export interface PayOrderResponse {
  payment: Payment;
  change?: number;
  amountReceived?: number;
  order: Order;
}

function token() {
  return getToken();
}

export const createOrder = (data: CreateOrderInput) =>
  apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }, token());

export const getOrders = (
  status?: OrderStatus,
  today = true,
  source?: OrderSource,
  type?: OrderType,
  unpaid = false,
) => {
  const params = new URLSearchParams({ today: String(today) });
  if (status) params.set('status', status);
  if (source) params.set('source', source);
  if (type) params.set('type', type);
  if (unpaid) params.set('unpaid', 'true');
  return apiFetch<Order[]>(`/orders?${params}`, {}, token());
};

export const getEntrantesOrders = () =>
  getOrders(undefined, true, 'MENU_PUBLICO', undefined, true);

export const getMesaOrders = () =>
  getOrders(undefined, true, 'CAJA', 'MESA');

export const getOrder = (id: string) =>
  apiFetch<Order>(`/orders/${id}`, {}, token());

export const payOrder = (
  id: string,
  method: PaymentMethod,
  amountReceived?: number,
  billing?: PayOrderBillingInput,
) =>
  apiFetch<PayOrderResponse>(
    `/orders/${id}/payments`,
    {
      method: 'POST',
      body: JSON.stringify({
        method,
        ...(method === 'EFECTIVO' && amountReceived != null
          ? { amountReceived }
          : {}),
        ...(billing?.billingNit?.trim()
          ? {
              billingNit: billing.billingNit.trim(),
              billingBusinessName: billing.billingBusinessName?.trim(),
              billingComplement: billing.billingComplement?.trim() || undefined,
            }
          : {}),
      }),
    },
    token(),
  );

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  apiFetch<Order>(
    `/orders/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    token(),
  );

export const updateMesaOrder = (id: string, data: UpdateMesaOrderInput) =>
  apiFetch<Order>(
    `/orders/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token(),
  );

export const confirmPublicOrder = (id: string) =>
  apiFetch<Order>(`/orders/${id}/confirm`, { method: 'POST' }, token());

export function formatOrderNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`;
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-BO', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
  });
}
