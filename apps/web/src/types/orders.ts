export type OrderType = 'MESA' | 'PARA_LLEVAR' | 'DELIVERY';
export type OrderSource = 'CAJA' | 'MENU_PUBLICO';
export type OrderStatus =
  | 'PENDIENTE_CONFIRMACION'
  | 'PENDIENTE'
  | 'EN_COCINA'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface OrderItemExtra {
  id: string;
  extraId: string;
  extraName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes: string | null;
  extras: OrderItemExtra[];
}

export type PaymentMethod = 'EFECTIVO' | 'QR' | 'TARJETA';

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  billingNit?: string | null;
  billingBusinessName?: string | null;
  billingComplement?: string | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  type: OrderType;
  source: OrderSource;
  status: OrderStatus;
  tableNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryReference: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  publicTrackingToken?: string | null;
  payment: Payment | null;
  createdBy?: { id: string; name: string } | null;
  items: OrderItem[];
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  QR: 'QR',
  TARJETA: 'Tarjeta',
};

export interface PayOrderBillingInput {
  billingNit?: string;
  billingBusinessName?: string;
  billingComplement?: string;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  extraIds?: string[];
  notes?: string;
}

export interface CreateOrderInput {
  type: OrderType;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryReference?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  notes?: string;
  items: CreateOrderItemInput[];
}

export interface UpdateMesaOrderInput {
  tableNumber: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  MESA: 'Mesa',
  PARA_LLEVAR: 'Para recojo',
  DELIVERY: 'Delivery',
};

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  CAJA: 'Caja',
  MENU_PUBLICO: 'Menú público',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'Por confirmar',
  PENDIENTE: 'Pendiente',
  EN_COCINA: 'En cocina',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'bg-amber-100 text-amber-800',
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  EN_COCINA: 'bg-blue-100 text-blue-800',
  LISTO: 'bg-green-100 text-green-800',
  ENTREGADO: 'bg-gray-100 text-gray-600',
  CANCELADO: 'bg-red-100 text-red-700',
};

export function getOrderSummary(order: Order): string {
  if (order.type === 'MESA' && order.tableNumber) {
    return `Mesa ${order.tableNumber}`;
  }
  if (order.type === 'DELIVERY') {
    const parts = [order.customerName, order.deliveryAddress].filter(Boolean);
    return parts.join(' · ') || ORDER_TYPE_LABELS.DELIVERY;
  }
  if (order.customerName) return order.customerName;
  return ORDER_TYPE_LABELS[order.type];
}

export function canEditOrder(order: Order): boolean {
  return (
    order.type === 'MESA' &&
    order.source === 'CAJA' &&
    order.status === 'PENDIENTE' &&
    !order.payment
  );
}
