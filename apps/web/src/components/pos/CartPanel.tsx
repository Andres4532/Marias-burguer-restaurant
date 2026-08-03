'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/catalog';
import { ORDER_TYPE_LABELS } from '@/types/orders';
import type { useCart, CartItem } from '@/hooks/useCart';

type Cart = ReturnType<typeof useCart>;

interface CartPanelProps {
  cart: Cart;
  error?: string;
  submitting?: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  getMaxQuantity?: (item: CartItem) => number;
}

export function CartPanel({
  cart,
  error,
  submitting,
  onSubmit,
  submitLabel = 'Confirmar pedido',
  getMaxQuantity,
}: CartPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-foreground text-lg">
            Pedido actual
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {cart.itemCount} producto(s) · {ORDER_TYPE_LABELS[cart.orderType]}
          </p>
        </div>
        {cart.items.length > 0 && (
          <button
            type="button"
            onClick={cart.clearCart}
            className="text-sm font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/40 transition"
          >
            Vaciar
          </button>
        )}
      </div>

      {cart.items.length === 0 ? (
        <div className="flex-1 py-10 text-center">
          <p className="text-sm text-text-secondary">
            Toca un producto para agregarlo al pedido
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1">
          {cart.items.map((item) => {
            const unit = cart.unitPrice(item);
            return (
              <div
                key={item.key}
                className="border-b border-border pb-3 last:border-0"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {item.quantity}× {item.productName}
                    </p>
                    {item.extras.length > 0 && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.extras.map((e) => e.name).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary mt-0.5">
                      {formatPrice(unit)} c/u
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(item.key)}
                    className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-red-400 hover:bg-red-950/40 rounded-lg text-xl transition"
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        cart.updateQuantity(item.key, item.quantity - 1)
                      }
                      className="w-9 h-9 rounded-xl bg-background border border-border text-foreground font-bold text-lg hover:bg-white/[0.06] active:scale-95 transition"
                    >
                      −
                    </button>
                    <span className="text-sm font-extrabold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const max = getMaxQuantity?.(item);
                        const next = item.quantity + 1;
                        if (max != null && Number.isFinite(max) && next > max) {
                          return;
                        }
                        cart.updateQuantity(item.key, next);
                      }}
                      disabled={
                        getMaxQuantity != null &&
                        item.quantity >= getMaxQuantity(item)
                      }
                      className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-lg hover:bg-primary/15 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-extrabold text-foreground">
                    {formatPrice(unit * item.quantity)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border space-y-3 shrink-0">
        {(cart.orderType === 'MESA' || cart.orderType === 'PARA_LLEVAR') && (
          <Input
            label={
              cart.orderType === 'MESA'
                ? 'Nombre por el que llaman'
                : 'Nombre para recojo'
            }
            placeholder="Ej: Juan Pérez"
            value={cart.customerName}
            onChange={(e) => cart.setCustomerName(e.target.value)}
          />
        )}

        <Input
          label="Notas del pedido"
          placeholder="Ej: sin cebolla"
          value={cart.orderNotes}
          onChange={(e) => cart.setOrderNotes(e.target.value)}
        />

        <div className="flex justify-between items-center">
          <span className="font-bold text-foreground">Total</span>
          <span className="text-2xl font-extrabold text-primary">
            {formatPrice(cart.subtotal)}
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl font-medium">
            {error}
          </p>
        )}

        <Button
          onClick={onSubmit}
          disabled={submitting || cart.items.length === 0}
          size="lg"
          className="w-full"
        >
          {submitting ? 'Procesando...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
