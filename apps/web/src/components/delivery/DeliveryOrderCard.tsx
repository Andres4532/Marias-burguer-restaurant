'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/catalog';
import { formatOrderNumber, formatTime } from '@/lib/orders';
import { copyDeliveryWhatsAppMessage } from '@/lib/delivery-handoff';
import { getDeliveryWorkflowStep, shouldShowSpeedHandoff } from '@/lib/delivery-workflow';
import { DeliveryMapLinks } from '@/components/orders/DeliveryMapLinks';
import { hasDeliveryCoordinates } from '@/lib/maps';
import type { Order } from '@/types/orders';

interface DeliveryOrderCardProps {
  order: Order;
  busy?: boolean;
  onAction: (order: Order) => void;
}

export function DeliveryOrderCard({
  order,
  busy,
  onAction,
}: DeliveryOrderCardProps) {
  const [copied, setCopied] = useState(false);
  const workflow = getDeliveryWorkflowStep(order);
  const hasMap = hasDeliveryCoordinates(
    order.deliveryLatitude,
    order.deliveryLongitude,
  );
  const showSpeed = shouldShowSpeedHandoff(order);

  const handleCopySpeed = async () => {
    try {
      await copyDeliveryWhatsAppMessage(order);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-extrabold text-foreground">
              {formatOrderNumber(order.orderNumber)}
            </span>
            <span className="text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5">
              {workflow.phaseLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-1 truncate">
            {order.customerName || 'Sin nombre'}
            {order.customerPhone && (
              <span className="text-text-secondary font-normal">
                {' '}
                · {order.customerPhone}
              </span>
            )}
          </p>
          {order.deliveryAddress && (
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
              {order.deliveryAddress}
            </p>
          )}
          <p className="text-xs text-text-secondary mt-1">
            {formatTime(order.createdAt)} · {order.items.length} producto(s)
          </p>
        </div>
        <p className="text-lg font-extrabold text-primary shrink-0">
          {formatPrice(order.total)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {Array.from({ length: workflow.totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const active = stepNumber <= workflow.step;
          return (
            <div
              key={stepNumber}
              className={`h-1.5 flex-1 rounded-full ${
                active ? 'bg-primary' : 'bg-border'
              }`}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-text-secondary mt-1">
        Paso {workflow.step} de {workflow.totalSteps}
      </p>

      {workflow.action !== 'done' && (
        <div className="mt-4 space-y-2">
          <Button
            className="w-full"
            size="lg"
            variant={workflow.step === 1 ? 'success' : 'primary'}
            disabled={busy}
            onClick={() => onAction(order)}
          >
            {busy ? 'Procesando…' : workflow.actionLabel}
          </Button>
          {workflow.hint && (
            <p className="text-xs text-text-secondary text-center leading-relaxed">
              {workflow.hint}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {showSpeed && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => void handleCopySpeed()}
          >
            {copied ? '¡Copiado!' : 'Copiar para Speed'}
          </Button>
        )}

        <div
          className={`grid gap-2 ${hasMap ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {hasMap && (
            <DeliveryMapLinks
              latitude={order.deliveryLatitude}
              longitude={order.deliveryLongitude}
              fullWidth
            />
          )}
          <Link
            href={`/pedidos/${order.id}`}
            className={hasMap ? '' : 'col-span-1'}
          >
            <Button type="button" variant="secondary" size="sm" className="w-full">
              Detalle
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
