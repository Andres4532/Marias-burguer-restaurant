'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SAUCE_PLACEMENT_LABELS } from '@/lib/sauce-labels';
import type { CatalogCategory, SaucePlacement } from '@/types/catalog';
import type { CartSauce } from '@/hooks/useCart';

export type CatalogProduct = CatalogCategory['products'][number];

interface SaucePickerModalProps {
  open: boolean;
  product: CatalogProduct | null;
  onClose: () => void;
  onConfirm: (sauces: CartSauce[]) => void;
}

export function SaucePickerModal({
  open,
  product,
  onClose,
  onConfirm,
}: SaucePickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [placement, setPlacement] = useState<SaucePlacement>('ON_PRODUCT');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !product) return;
    setSelectedIds([]);
    setPlacement('ON_PRODUCT');
    setError('');
  }, [open, product?.id]);

  if (!product) return null;

  const isSingle = product.sauceMode === 'SINGLE';
  const showPlacement = product.allowSauceSeparate;

  const toggleSauce = (sauceId: string) => {
    setError('');
    if (isSingle) {
      setSelectedIds([sauceId]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(sauceId)
        ? prev.filter((id) => id !== sauceId)
        : [...prev, sauceId],
    );
  };

  const handleConfirm = () => {
    if (isSingle && selectedIds.length !== 1) {
      setError('Selecciona una salsa');
      return;
    }
    if (!isSingle && selectedIds.length === 0) {
      setError('Selecciona al menos una salsa');
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

    onConfirm(sauces);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Salsas · ${product.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {isSingle
            ? 'Elige una salsa para acompañar este producto.'
            : 'Elige una o más salsas para acompañar este producto.'}
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-background p-3">
          {product.sauces.map((sauce) => {
            const checked = selectedIds.includes(sauce.id);
            return (
              <label
                key={sauce.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                  checked ? 'bg-primary/10' : 'hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type={isSingle ? 'radio' : 'checkbox'}
                  name={`sauce-${product.id}`}
                  checked={checked}
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

        {showPlacement && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              ¿Cómo la(s) quieres?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['ON_PRODUCT', 'SEPARATE'] as SaucePlacement[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPlacement(value)}
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
): boolean {
  return product.sauceMode === 'SINGLE' || product.sauceMode === 'MULTIPLE';
}
