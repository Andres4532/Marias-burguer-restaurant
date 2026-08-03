'use client';

import type { ReactNode } from 'react';
import { CartPanel } from '@/components/pos/CartPanel';
import { FormError } from '@/components/ui/CrudForm';
import { formatPrice } from '@/lib/catalog';
import type { useCart, CartItem } from '@/hooks/useCart';

type Cart = ReturnType<typeof useCart>;

interface MobileCartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  error?: string;
  submitting?: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  header?: ReactNode;
  wide?: boolean;
  getMaxQuantity?: (item: CartItem) => number;
}

export function MobileCartDrawer({
  open,
  onClose,
  cart,
  error,
  submitting,
  onSubmit,
  submitLabel,
  header,
  wide = false,
  getMaxQuantity,
}: MobileCartDrawerProps) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative bg-card rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl border-t border-border ${
          wide ? 'w-full max-w-2xl mx-auto max-h-[92vh]' : ''
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-4 text-text-secondary hover:text-foreground text-2xl leading-none p-1"
          aria-label="Cerrar"
        >
          ×
        </button>
        <div
          className={`flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain ${
            wide ? 'p-5 sm:p-6 pt-2 pb-6' : 'p-4 pt-2 pb-6'
          }`}
        >
          {error && (
            <div className="mb-3 shrink-0">
              <FormError message={error} />
            </div>
          )}
          {header}
          <CartPanel
            cart={cart}
            error={error}
            submitting={submitting}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
            getMaxQuantity={getMaxQuantity}
          />
        </div>
      </div>
    </div>
  );
}

interface MobileCartBarProps {
  itemCount: number;
  total: number;
  onOpen: () => void;
}

export function MobileCartBar({ itemCount, total, onOpen }: MobileCartBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-2">
      <button
        type="button"
        onClick={onOpen}
        className="w-full max-w-lg mx-auto flex items-center justify-between bg-primary hover:bg-primary-hover text-white rounded-2xl px-5 py-4 shadow-lg shadow-primary/25 active:scale-[0.98] transition"
      >
        <span className="font-extrabold">Ver pedido ({itemCount})</span>
        <span className="font-extrabold text-lg">{formatPrice(total)}</span>
      </button>
    </div>
  );
}
