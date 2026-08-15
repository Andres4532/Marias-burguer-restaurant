import type { CartItem } from '@/hooks/useCart';
import type { CreateOrderItemInput } from '@/types/orders';

export function cartItemsToOrderInput(items: CartItem[]): CreateOrderItemInput[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    extraIds: item.extras.length ? item.extras.map((e) => e.id) : undefined,
    sauces: item.sauces.length
      ? item.sauces.map((s) => ({ sauceId: s.id, placement: s.placement }))
      : undefined,
    noSauce: item.noSauce ? true : undefined,
    applyPromo: item.applyPromo === false ? false : undefined,
    notes: item.notes,
  }));
}
