'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import { ProductDescription } from '@/components/catalog/ProductDescription';
import { isOutOfStock } from '@/lib/inventory';
import type { CatalogCategory } from '@/types/catalog';

export type MenuCatalogProduct = CatalogCategory['products'][number];

interface MenuProductDetailModalProps {
  open: boolean;
  product: MenuCatalogProduct | null;
  onClose: () => void;
  onAdd: (product: MenuCatalogProduct) => void;
}

export function MenuProductDetailModal({
  open,
  product,
  onClose,
  onAdd,
}: MenuProductDetailModalProps) {
  if (!product) return null;

  const out = isOutOfStock(product);

  return (
    <Modal open={open} onClose={onClose} title={product.name}>
      <div className="space-y-4">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          aspect="menu"
          className="w-full rounded-xl"
        />

        {product.description ? (
          <ProductDescription
            description={product.description}
            className="text-sm"
          />
        ) : (
          <p className="text-sm text-text-secondary italic">
            Sin descripción adicional.
          </p>
        )}

        <ProductPrice
          price={product.price}
          effectivePrice={product.effectivePrice}
          hasPromotion={product.hasPromotion}
          promoLabel={product.promoLabel}
          showBadge
          size="md"
        />

        {out ? (
          <p className="text-sm font-bold text-red-400">
            Este producto no está disponible por ahora.
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            className="flex-1"
            disabled={out}
            onClick={() => onAdd(product)}
          >
            Agregar al pedido
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
