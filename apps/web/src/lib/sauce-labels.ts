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

export function formatCartSauceLine(name: string, placement: SaucePlacement): string {
  if (placement === 'SEPARATE') {
    return `${name} · aparte`;
  }
  return name;
}
