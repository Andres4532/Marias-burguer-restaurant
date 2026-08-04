import { ProductPromoType } from '@prisma/client';
import { toNumber } from './decimal.util';

export type ProductPromoFields = {
  price: { toString(): string } | number;
  promoType: ProductPromoType;
  promoValue: { toString(): string } | number | null;
  promoStartsAt: Date | null;
  promoEndsAt: Date | null;
};

export type ProductPromoPricing = {
  listPrice: number;
  effectivePrice: number;
  hasPromotion: boolean;
  promoType: ProductPromoType;
  promoLabel: string | null;
  discountAmount: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
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
  const listPrice = roundMoney(toNumber(product.price));

  if (
    product.promoType === ProductPromoType.NONE ||
    product.promoValue == null
  ) {
    return {
      listPrice,
      effectivePrice: listPrice,
      hasPromotion: false,
      promoType: ProductPromoType.NONE,
      promoLabel: null,
      discountAmount: 0,
    };
  }

  if (!isPromoActive(product.promoStartsAt, product.promoEndsAt, now)) {
    return {
      listPrice,
      effectivePrice: listPrice,
      hasPromotion: false,
      promoType: ProductPromoType.NONE,
      promoLabel: null,
      discountAmount: 0,
    };
  }

  const promoValue = toNumber(product.promoValue);
  let effectivePrice = listPrice;
  let promoLabel: string | null = null;

  if (product.promoType === ProductPromoType.PERCENT) {
    const percent = Math.min(Math.max(promoValue, 0), 100);
    effectivePrice = roundMoney(listPrice * (1 - percent / 100));
    promoLabel = percent > 0 ? `-${Math.round(percent)}%` : null;
  } else if (product.promoType === ProductPromoType.FIXED_PRICE) {
    effectivePrice = roundMoney(Math.max(0, Math.min(promoValue, listPrice)));
    promoLabel = effectivePrice < listPrice ? 'Promo' : null;
  }

  const hasPromotion = effectivePrice < listPrice;

  return {
    listPrice,
    effectivePrice: hasPromotion ? effectivePrice : listPrice,
    hasPromotion,
    promoType: hasPromotion ? product.promoType : ProductPromoType.NONE,
    promoLabel: hasPromotion ? promoLabel : null,
    discountAmount: hasPromotion ? roundMoney(listPrice - effectivePrice) : 0,
  };
}

export function mapProductPromoFields(product: ProductPromoFields) {
  const pricing = getProductPromoPricing(product);
  return {
    price: pricing.listPrice,
    effectivePrice: pricing.effectivePrice,
    hasPromotion: pricing.hasPromotion,
    promoType: product.promoType,
    promoValue:
      product.promoValue == null ? null : toNumber(product.promoValue),
    promoStartsAt: product.promoStartsAt,
    promoEndsAt: product.promoEndsAt,
    promoLabel: pricing.promoLabel,
    discountAmount: pricing.discountAmount,
  };
}
