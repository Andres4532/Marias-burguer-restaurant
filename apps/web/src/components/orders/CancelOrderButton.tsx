'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/catalog';
import { updateOrderStatus } from '@/lib/orders';
import { canCancelOrder, type Order } from '@/types/orders';

export function getCancelOrderConfirmMessage(order: Order): string {
  if (order.payment) {
    return '¿Cancelar este pedido aunque ya fue cobrado? No sumará en ventas del reporte; devolvé el dinero al cliente si corresponde.';
  }
  return '¿Cancelar este pedido?';
}

interface CancelOrderButtonProps {
  order: Order;
  isJefa: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onCancelled?: () => void | Promise<void>;
}

export function CancelOrderButton({
  order,
  isJefa,
  disabled = false,
  size = 'lg',
  className = 'w-full',
  onCancelled,
}: CancelOrderButtonProps) {
  const [busy, setBusy] = useState(false);

  if (!canCancelOrder(order, isJefa)) {
    return null;
  }

  const handleCancel = async () => {
    if (!confirm(getCancelOrderConfirmMessage(order))) return;

    setBusy(true);
    try {
      await updateOrderStatus(order.id, 'CANCELADO');
      await onCancelled?.();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="danger"
      size={size}
      className={className}
      disabled={disabled || busy}
      onClick={() => void handleCancel()}
    >
      {busy ? 'Cancelando…' : 'Cancelar pedido'}
    </Button>
  );
}
