import type { SaucePlacement } from '@/types/catalog';
import type { OrderType } from '@/types/orders';

export const MAX_SAUCES_TAKEAWAY_DELIVERY = 3;

export function allowsSauceSeparate(orderType: OrderType): boolean {
  return orderType === 'PARA_LLEVAR' || orderType === 'DELIVERY';
}

export function getMaxSaucesForProduct(
  orderType: OrderType,
  sauceMode: 'SINGLE' | 'MULTIPLE' | 'NONE' | undefined,
  placement: SaucePlacement,
): number {
  if (sauceMode === 'SINGLE') return 1;
  if (placement === 'SEPARATE') return 1;
  if (allowsSauceSeparate(orderType) && sauceMode === 'MULTIPLE') {
    return MAX_SAUCES_TAKEAWAY_DELIVERY;
  }
  if (sauceMode === 'MULTIPLE') return Number.POSITIVE_INFINITY;
  return 1;
}

export function canShowSaucePlacement(
  orderType: OrderType,
  allowSauceSeparate: boolean,
): boolean {
  return allowSauceSeparate && allowsSauceSeparate(orderType);
}
