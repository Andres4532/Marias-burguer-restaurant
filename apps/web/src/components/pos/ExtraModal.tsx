'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/catalog';
import { partitionProductExtras } from '@/lib/extras-utils';
import type { CatalogCategory } from '@/types/catalog';

type CatalogProduct = CatalogCategory['products'][number];

interface ExtraModalProps {
  product: CatalogProduct | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (
    product: CatalogProduct,
    extras: Array<{ id: string; name: string; price: number }>,
  ) => void;
}

export function ExtraModal({ product, open, onClose, onConfirm }: ExtraModalProps) {
  const [selectedSauceId, setSelectedSauceId] = useState<string | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const handleClose = () => {
    setSelectedSauceId(null);
    setSelectedToppings([]);
    onClose();
  };

  const toggleTopping = (id: string) => {
    setSelectedToppings((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    if (!product) return;
    const sauceIds = selectedSauceId ? [selectedSauceId] : [];
    const allIds = [...sauceIds, ...selectedToppings];
    const extras = product.extras.filter((e) => allIds.includes(e.id));
    onConfirm(product, extras);
    setSelectedSauceId(null);
    setSelectedToppings([]);
    onClose();
  };

  if (!product) return null;

  const { sauces, toppings } = partitionProductExtras(product.extras);
  const selectedExtras = product.extras.filter(
    (e) =>
      (selectedSauceId && e.id === selectedSauceId) ||
      selectedToppings.includes(e.id),
  );
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);

  return (
    <Modal open={open} onClose={handleClose} title={product.name}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Precio base: {formatPrice(product.price)}
        </p>

        {sauces.length > 0 && (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-bold text-foreground">
                Salsa en el producto
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Elige una salsa que va con tu pedido (incluida)
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-primary/[0.02] cursor-pointer transition">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="radio"
                    name={`sauce-${product.id}`}
                    checked={selectedSauceId === null}
                    onChange={() => setSelectedSauceId(null)}
                    className="border-border text-primary focus:ring-primary/30"
                  />
                  Sin salsa extra
                </span>
                <span className="text-xs font-bold text-text-secondary">
                  —
                </span>
              </label>
              {sauces.map((extra) => (
                <label
                  key={extra.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-primary/[0.02] cursor-pointer transition"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      name={`sauce-${product.id}`}
                      checked={selectedSauceId === extra.id}
                      onChange={() => setSelectedSauceId(extra.id)}
                      className="border-border text-primary focus:ring-primary/30"
                    />
                    {extra.name}
                  </span>
                  <span className="text-sm font-bold text-text-secondary">
                    {extra.price > 0 ? `+${formatPrice(extra.price)}` : 'Incluida'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {toppings.length > 0 && (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-bold text-foreground">
                Complementos en el producto
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Opcional — se agregan a este producto
              </p>
            </div>
            {toppings.map((extra) => (
              <label
                key={extra.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-primary/[0.02] cursor-pointer transition"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedToppings.includes(extra.id)}
                    onChange={() => toggleTopping(extra.id)}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                  {extra.name}
                </span>
                <span className="text-sm font-bold text-text-secondary">
                  {extra.price > 0 ? `+${formatPrice(extra.price)}` : 'Gratis'}
                </span>
              </label>
            ))}
          </div>
        )}

        {sauces.length === 0 && toppings.length === 0 && (
          <p className="text-sm text-text-secondary">Sin extras disponibles</p>
        )}

        <p className="text-xs text-text-secondary bg-background border border-border rounded-xl px-3 py-2">
          ¿Porción de salsa aparte? Buscala en la categoría{' '}
          <strong className="text-foreground">Salsas aparte</strong> del menú.
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-bold text-foreground">Total unitario</span>
          <span className="font-extrabold text-primary text-lg">
            {formatPrice(product.price + extrasTotal)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirm} className="flex-1">
            Agregar al pedido
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
