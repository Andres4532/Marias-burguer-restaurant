import type { ProductSauceMode, SaucePlacement } from '@/types/catalog';

export const SAUCE_MODE_LABELS: Record<ProductSauceMode, string> = {
  NONE: 'Sin salsas',
  SINGLE: 'Una salsa',
  MULTIPLE: 'Varias salsas',
};

export const SAUCE_PLACEMENT_LABELS: Record<SaucePlacement, string> = {
  ON_PRODUCT: 'En el producto',
  SEPARATE: 'Apartado',
};

export const SAUCE_NONE_LABEL = 'Sin salsa';

export function formatCartSauceLine(name: string, placement: SaucePlacement): string {
  if (placement === 'SEPARATE') {
    return `${name} · aparte`;
  }
  return name;
}

export function formatCartItemSauces(item: {
  noSauce?: boolean;
  sauces: Array<{ name: string; placement: SaucePlacement }>;
}): string | null {
  if (item.noSauce) return SAUCE_NONE_LABEL;
  if (!item.sauces.length) return null;
  return item.sauces.map((s) => formatCartSauceLine(s.name, s.placement)).join(' · ');
}

export function formatOrderItemSauces(item: {
  noSauce?: boolean;
  sauces?: Array<{ sauceName: string; placement: SaucePlacement }>;
}): string | null {
  if (item.noSauce) return SAUCE_NONE_LABEL;
  if (!item.sauces?.length) return null;
  return item.sauces
    .map((s) => formatCartSauceLine(s.sauceName, s.placement))
    .join(' · ');
}
