'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import { ProductDescription } from '@/components/catalog/ProductDescription';
import { formatPrice } from '@/lib/catalog';
import { resolveCartBasePrice } from '@/lib/product-pricing';
import type { CatalogCategory } from '@/types/catalog';

export type CatalogProduct = CatalogCategory['products'][number];

interface PromoChoiceModalProps {
  open: boolean;
  product: CatalogProduct | null;
  onClose: () => void;
  onConfirm: (applyPromo: boolean) => void;
}

export function PromoChoiceModal({
  open,
  product,
  onClose,
  onConfirm,
}: PromoChoiceModalProps) {
  const [applyPromo, setApplyPromo] = useState(true);

  useEffect(() => {
    if (open) setApplyPromo(true);
  }, [open, product?.id]);

  if (!product) return null;

  const unitPrice = resolveCartBasePrice(product, applyPromo);

  return (
    <Modal open={open} onClose={onClose} title={`Promoción · ${product.name}`}>
      <div className="space-y-4">
        <ProductPrice
          price={product.price}
          effectivePrice={product.effectivePrice}
          hasPromotion={product.hasPromotion}
          promoLabel={product.promoLabel}
          size="md"
        />

        <ProductDescription description={product.description} className="text-sm" />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
          <input
            type="checkbox"
            checked={applyPromo}
            onChange={(e) => setApplyPromo(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Aplicar descuento / promoción
            </span>
            <span className="mt-1 block text-xs text-text-secondary">
              {applyPromo
                ? `Precio con promo: ${formatPrice(unitPrice)}`
                : `Precio normal: ${formatPrice(unitPrice)} (sin descuento)`}
            </span>
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => onConfirm(applyPromo)}
            className="flex-1"
          >
            Agregar al pedido
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
