import type { Order } from '@/types/orders';

export type DeliveryWorkflowAction =
  | 'confirm'
  | 'charge'
  | 'dispatch'
  | 'deliver'
  | 'done';

export interface DeliveryWorkflowStep {
  step: number;
  totalSteps: number;
  phaseLabel: string;
  action: DeliveryWorkflowAction;
  actionLabel: string;
  hint?: string;
}

export function getDeliveryWorkflowStep(order: Order): DeliveryWorkflowStep {
  const done: DeliveryWorkflowStep = {
    step: 4,
    totalSteps: 4,
    phaseLabel: 'Finalizado',
    action: 'done',
    actionLabel: '',
  };

  if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') {
    return done;
  }

  if (order.status === 'PENDIENTE_CONFIRMACION') {
    return {
      step: 1,
      totalSteps: 4,
      phaseLabel: 'Nuevo',
      action: 'confirm',
      actionLabel: 'Confirmar y avisar cliente',
      hint: 'Envía a cocina y abre WhatsApp: se está preparando',
    };
  }

  if (!order.payment) {
    return {
      step: 2,
      totalSteps: 4,
      phaseLabel: 'Sin cobrar',
      action: 'charge',
      actionLabel: 'Cobrar pedido',
      hint: 'Registra el pago antes de despachar',
    };
  }

  if (order.status === 'EN_COCINA') {
    return {
      step: 3,
      totalSteps: 4,
      phaseLabel: 'En cocina',
      action: 'dispatch',
      actionLabel: 'En camino · avisar cliente',
      hint: 'WhatsApp al cliente + copia para el repartidor',
    };
  }

  if (order.status === 'LISTO') {
    return {
      step: 4,
      totalSteps: 4,
      phaseLabel: 'En camino',
      action: 'deliver',
      actionLabel: 'Marcar entregado',
    };
  }

  return done;
}

export interface DeliverySections {
  confirm: Order[];
  charge: Order[];
  dispatch: Order[];
  deliver: Order[];
}

export function groupDeliveryOrders(orders: Order[]): DeliverySections {
  const sections: DeliverySections = {
    confirm: [],
    charge: [],
    dispatch: [],
    deliver: [],
  };

  for (const order of orders) {
    if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') {
      continue;
    }

    const { action } = getDeliveryWorkflowStep(order);
    if (action === 'confirm') sections.confirm.push(order);
    else if (action === 'charge') sections.charge.push(order);
    else if (action === 'dispatch') sections.dispatch.push(order);
    else if (action === 'deliver') sections.deliver.push(order);
  }

  return sections;
}

export function countActiveDeliveryOrders(orders: Order[]): number {
  return orders.filter(
    (order) =>
      order.type === 'DELIVERY' &&
      order.status !== 'ENTREGADO' &&
      order.status !== 'CANCELADO',
  ).length;
}
