'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SAUCE_NONE_LABEL, SAUCE_PLACEMENT_LABELS } from '@/lib/sauce-labels';
import { ProductDescription } from '@/components/catalog/ProductDescription';
import {
  MAX_SAUCES_TAKEAWAY_DELIVERY,
  canShowSaucePlacement,
  getMaxSaucesForProduct,
} from '@/lib/sauce-rules';
import type { CatalogCategory, SaucePlacement } from '@/types/catalog';
import type { CartSauce } from '@/hooks/useCart';
import type { OrderType } from '@/types/orders';

export type CatalogProduct = CatalogCategory['products'][number];

interface SaucePickerModalProps {
  open: boolean;
  product: CatalogProduct | null;
  orderType: OrderType;
  onClose: () => void;
  onConfirm: (sauces: CartSauce[], noSauce: boolean) => void;
}

export function SaucePickerModal({
  open,
  product,
  orderType,
  onClose,
  onConfirm,
}: SaucePickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noSauce, setNoSauce] = useState(false);
  const [placement, setPlacement] = useState<SaucePlacement>('ON_PRODUCT');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !product) return;
    setSelectedIds([]);
    setNoSauce(false);
    setPlacement('ON_PRODUCT');
    setError('');
  }, [open, product?.id]);

  if (!product) return null;

  const isSingle = product.sauceMode === 'SINGLE';
  const showPlacement = canShowSaucePlacement(
    orderType,
    product.allowSauceSeparate,
  );
  const maxSauces = getMaxSaucesForProduct(orderType, product.sauceMode, placement);

  const selectNoSauce = () => {
    setError('');
    setNoSauce(true);
    setSelectedIds([]);
  };

  const toggleSauce = (sauceId: string) => {
    setError('');
    setNoSauce(false);
    if (isSingle || maxSauces === 1) {
      setSelectedIds([sauceId]);
      return;
    }
    setSelectedIds((prev) => {
      if (prev.includes(sauceId)) {
        return prev.filter((id) => id !== sauceId);
      }
      if (prev.length >= maxSauces) {
        setError(`Máximo ${maxSauces} salsas para este producto`);
        return prev;
      }
      return [...prev, sauceId];
    });
  };

  const handlePlacementChange = (value: SaucePlacement) => {
    setPlacement(value);
    setError('');
    if (value === 'SEPARATE') {
      setSelectedIds((prev) => (prev.length > 1 ? prev.slice(0, 1) : prev));
    }
  };

  const handleConfirm = () => {
    if (noSauce) {
      onConfirm([], true);
      onClose();
      return;
    }

    if (isSingle && selectedIds.length !== 1) {
      setError('Selecciona una salsa o marca sin salsa');
      return;
    }
    if (!isSingle && selectedIds.length === 0) {
      setError('Selecciona al menos una salsa o marca sin salsa');
      return;
    }
    if (placement === 'SEPARATE' && selectedIds.length !== 1) {
      setError('Si la quieres aparte, elige solo una salsa');
      return;
    }
    if (selectedIds.length > maxSauces) {
      setError(`Máximo ${maxSauces} salsas para este producto`);
      return;
    }

    const sauces: CartSauce[] = selectedIds.map((id) => {
      const sauce = product.sauces.find((s) => s.id === id)!;
      return {
        id: sauce.id,
        name: sauce.name,
        placement: showPlacement ? placement : 'ON_PRODUCT',
      };
    });

    onConfirm(sauces, false);
    onClose();
  };

  const selectionHint = isSingle
    ? 'Elige una salsa, o indica si no quieres ninguna.'
    : placement === 'SEPARATE'
      ? 'Si la quieres aparte, elige solo una salsa.'
      : maxSauces === MAX_SAUCES_TAKEAWAY_DELIVERY
        ? `Elige hasta ${maxSauces} salsas, o marca sin salsa.`
        : 'Elige una o más salsas, o marca sin salsa.';

  return (
    <Modal open={open} onClose={onClose} title={`Salsas · ${product.name}`}>
      <div className="space-y-4">
        <ProductDescription description={product.description} className="text-sm" />

        <p className="text-sm text-text-secondary">{selectionHint}</p>

        <div className="space-y-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-background p-3">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
              noSauce ? 'bg-primary/10' : 'hover:bg-white/[0.04]'
            }`}
          >
            <input
              type="radio"
              name={`sauce-choice-${product.id}`}
              checked={noSauce}
              onChange={selectNoSauce}
              className="size-4 accent-primary"
            />
            <span className="text-sm font-semibold text-foreground">
              {SAUCE_NONE_LABEL}
            </span>
          </label>

          {product.sauces.map((sauce) => {
            const checked = !noSauce && selectedIds.includes(sauce.id);
            const atMax =
              !noSauce &&
              !isSingle &&
              maxSauces > 1 &&
              !checked &&
              selectedIds.length >= maxSauces;
            return (
              <label
                key={sauce.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                  checked
                    ? 'bg-primary/10'
                    : atMax
                      ? 'opacity-50'
                      : 'hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type={isSingle || maxSauces === 1 ? 'radio' : 'checkbox'}
                  name={`sauce-${product.id}`}
                  checked={checked}
                  disabled={atMax}
                  onChange={() => toggleSauce(sauce.id)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-semibold text-foreground">
                  {sauce.name}
                </span>
              </label>
            );
          })}
        </div>

        {showPlacement && !noSauce && selectedIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              ¿Cómo la(s) quieres?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['ON_PRODUCT', 'SEPARATE'] as SaucePlacement[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePlacementChange(value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    placement === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-white/[0.04]'
                  }`}
                >
                  {SAUCE_PLACEMENT_LABELS[value]}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl font-medium">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleConfirm} className="flex-1">
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

export function productNeedsSaucePicker(
  product: { sauceMode?: string },
  orderType: OrderType,
): boolean {
  if (orderType === 'MESA') return false;
  return product.sauceMode === 'SINGLE' || product.sauceMode === 'MULTIPLE';
}
