export type ProductPromoType = 'NONE' | 'PERCENT' | 'FIXED_PRICE';

export interface ProductPromoFields {
  price: number;
  promoType?: ProductPromoType;
  promoValue?: number | null;
  promoStartsAt?: string | Date | null;
  promoEndsAt?: string | Date | null;
}

export interface ProductPromoPricing {
  listPrice: number;
  effectivePrice: number;
  hasPromotion: boolean;
  promoLabel: string | null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function isPromoActive(
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date,
): boolean {
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

export function getProductPromoPricing(
  product: ProductPromoFields,
  now = new Date(),
): ProductPromoPricing {
  const listPrice = roundMoney(product.price);
  const promoType = product.promoType ?? 'NONE';

  if (promoType === 'NONE' || product.promoValue == null) {
    return {
      listPrice,
      effectivePrice: listPrice,
      hasPromotion: false,
      promoLabel: null,
    };
  }

  if (
    !isPromoActive(toDate(product.promoStartsAt), toDate(product.promoEndsAt), now)
  ) {
    return {
      listPrice,
      effectivePrice: listPrice,
      hasPromotion: false,
      promoLabel: null,
    };
  }

  const promoValue = product.promoValue;
  let effectivePrice = listPrice;
  let promoLabel: string | null = null;

  if (promoType === 'PERCENT') {
    const percent = Math.min(Math.max(promoValue, 0), 100);
    effectivePrice = roundMoney(listPrice * (1 - percent / 100));
    promoLabel = percent > 0 ? `-${Math.round(percent)}%` : null;
  } else if (promoType === 'FIXED_PRICE') {
    effectivePrice = roundMoney(Math.max(0, Math.min(promoValue, listPrice)));
    promoLabel = effectivePrice < listPrice ? 'Promo' : null;
  }

  const hasPromotion = effectivePrice < listPrice;

  return {
    listPrice,
    effectivePrice: hasPromotion ? effectivePrice : listPrice,
    hasPromotion,
    promoLabel: hasPromotion ? promoLabel : null,
  };
}

export function getCartBasePrice(product: {
  price: number;
  effectivePrice?: number;
}): number {
  return product.effectivePrice ?? product.price;
}

export function resolveCartBasePrice(
  product: {
    price: number;
    effectivePrice?: number;
    hasPromotion?: boolean;
  },
  applyPromo = true,
): number {
  if (product.hasPromotion && !applyPromo) {
    return product.price;
  }
  return getCartBasePrice(product);
}

export function productNeedsPromoChoice(product: {
  hasPromotion?: boolean;
}): boolean {
  return !!product.hasPromotion;
}
