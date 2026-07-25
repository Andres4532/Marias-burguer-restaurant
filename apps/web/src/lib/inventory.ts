export type StockTrackedProduct = {
  id: string;
  trackStock?: boolean;
  stockQuantity?: number;
};

export type CartLineForStock = {
  key: string;
  productId: string;
  quantity: number;
};

export function isOutOfStock(product: StockTrackedProduct): boolean {
  return !!product.trackStock && (product.stockQuantity ?? 0) <= 0;
}

export function quantityInCartForProduct(
  cartItems: CartLineForStock[],
  productId: string,
): number {
  return cartItems
    .filter((i) => i.productId === productId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function canAddOneToCart(
  product: StockTrackedProduct,
  cartItems: CartLineForStock[],
): boolean {
  if (!product.trackStock) return true;
  return quantityInCartForProduct(cartItems, product.id) < (product.stockQuantity ?? 0);
}

export function maxQuantityForCartLine(
  product: StockTrackedProduct,
  cartItems: CartLineForStock[],
  lineKey: string,
): number {
  if (!product.trackStock) return Number.POSITIVE_INFINITY;
  const stock = product.stockQuantity ?? 0;
  const otherLines = cartItems
    .filter((i) => i.productId === product.id && i.key !== lineKey)
    .reduce((sum, i) => sum + i.quantity, 0);
  return Math.max(0, stock - otherLines);
}

export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(product: StockTrackedProduct): boolean {
  return (
    !!product.trackStock &&
    (product.stockQuantity ?? 0) > 0 &&
    (product.stockQuantity ?? 0) <= LOW_STOCK_THRESHOLD
  );
}
