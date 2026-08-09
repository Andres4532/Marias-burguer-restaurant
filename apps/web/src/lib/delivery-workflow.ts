import type { Order } from '@/types/orders';
import { isQrPublicOrder } from '@/types/orders';

export type DeliveryWorkflowAction =
  | 'confirm'
  | 'charge'
  | 'ready'
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
    const qrPending = isQrPublicOrder(order);
    return {
      step: 1,
      totalSteps: 4,
      phaseLabel: qrPending ? 'Pago QR' : 'Nuevo',
      action: 'confirm',
      actionLabel: qrPending
        ? 'Ver comprobante QR'
        : 'Confirmar y pedir Speed',
      hint: qrPending
        ? 'Revisa el comprobante antes de enviar a cocina'
        : 'Envía a cocina, avisa al cliente y copia el pedido para Speed',
    };
  }

  if (!order.payment) {
    return {
      step: 2,
      totalSteps: 4,
      phaseLabel: 'Esperando repartidor',
      action: 'charge',
      actionLabel: 'Cobrar al repartidor',
      hint: 'Cuando llegue Speed, cobrá aunque el pedido aún se esté preparando',
    };
  }

  if (order.status === 'EN_COCINA') {
    return {
      step: 3,
      totalSteps: 4,
      phaseLabel: 'Preparando',
      action: 'ready',
      actionLabel: 'Marcar listo · avisar salida',
      hint: 'La comida está lista: el repartidor sale y se avisa al cliente',
    };
  }

  if (order.status === 'LISTO') {
    return {
      step: 4,
      totalSteps: 4,
      phaseLabel: 'En camino',
      action: 'deliver',
      actionLabel: 'Marcar entregado',
      hint: 'Confirmá que el repartidor entregó al cliente',
    };
  }

  return done;
}

export interface DeliverySections {
  confirm: Order[];
  charge: Order[];
  ready: Order[];
  deliver: Order[];
}

export function groupDeliveryOrders(orders: Order[]): DeliverySections {
  const sections: DeliverySections = {
    confirm: [],
    charge: [],
    ready: [],
    deliver: [],
  };

  for (const order of orders) {
    if (order.status === 'ENTREGADO' || order.status === 'CANCELADO') {
      continue;
    }

    const { action } = getDeliveryWorkflowStep(order);
    if (action === 'confirm') sections.confirm.push(order);
    else if (action === 'charge') sections.charge.push(order);
    else if (action === 'ready') sections.ready.push(order);
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

export function shouldShowSpeedHandoff(order: Order): boolean {
  const { action } = getDeliveryWorkflowStep(order);
  return (
    action === 'confirm' ||
    action === 'charge' ||
    action === 'ready' ||
    action === 'deliver'
  );
}
