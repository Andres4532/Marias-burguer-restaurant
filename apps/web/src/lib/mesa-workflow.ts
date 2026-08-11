import type { Order, OrderStatus } from '@/types/orders';

const STATUS_PRIORITY: Record<OrderStatus, number> = {
  PENDIENTE_CONFIRMACION: 0,
  PENDIENTE: 1,
  EN_COCINA: 2,
  LISTO: 3,
  ENTREGADO: 4,
  CANCELADO: 5,
};

export type MesaWorkflowAction = 'charge' | 'ready' | 'deliver' | 'done';

export interface MesaWorkflowStep {
  action: MesaWorkflowAction;
  actionLabel: string;
  nextStatus?: OrderStatus;
}

export function getMesaWorkflowStep(order: Order): MesaWorkflowStep {
  if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') {
    return { action: 'done', actionLabel: '' };
  }

  if (order.status === 'PENDIENTE' && !order.payment) {
    return { action: 'charge', actionLabel: 'Cobrar' };
  }

  if (order.status === 'EN_COCINA') {
    return {
      action: 'ready',
      actionLabel: 'Marcar listo',
      nextStatus: 'LISTO',
    };
  }

  if (order.status === 'LISTO') {
    return {
      action: 'deliver',
      actionLabel: 'Marcar entregado',
      nextStatus: 'ENTREGADO',
    };
  }

  return { action: 'done', actionLabel: '' };
}

export function sortMesaOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function isMesaOrderFinished(order: Order): boolean {
  return order.status === 'ENTREGADO' || order.status === 'CANCELADO';
}
