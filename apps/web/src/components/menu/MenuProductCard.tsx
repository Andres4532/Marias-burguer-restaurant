'use client';

import { useCallback, useRef, useState } from 'react';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import { ProductDescription } from '@/components/catalog/ProductDescription';
import { isOutOfStock } from '@/lib/inventory';
import type { CatalogCategory } from '@/types/catalog';

export type MenuCatalogProduct = CatalogCategory['products'][number];

interface MenuProductCardProps {
  product: MenuCatalogProduct;
  onAdd: (product: MenuCatalogProduct) => void;
}

export function MenuProductCard({ product, onAdd }: MenuProductCardProps) {
  const out = isOutOfStock(product);
  const hasDescription = Boolean(product.description?.trim());
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const syncSlideFromScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el || el.clientWidth <= 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(index);
  }, []);

  const goToSlide = (index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setActiveSlide(index);
  };

  const handleAdd = () => {
    if (out) return;
    onAdd(product);
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition ${
        out ? 'opacity-50' : 'hover:border-primary/25 hover:shadow-md'
      }`}
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        aspect="menu"
        className="w-full shrink-0 rounded-none"
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {hasDescription ? (
          <>
            <div
              ref={sliderRef}
              onScroll={syncSlideFromScroll}
              className="flex min-h-[7.25rem] flex-1 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ touchAction: 'pan-x' }}
            >
              <button
                type="button"
                disabled={out}
                onClick={handleAdd}
                className={`flex w-full shrink-0 snap-start snap-always flex-col p-3 text-left transition ${
                  out ? 'cursor-not-allowed' : 'active:scale-[0.99]'
                }`}
              >
                <p className="font-bold text-foreground text-sm leading-tight">
                  {product.name}
                </p>
                <div className="mt-auto pt-2">
                  <ProductPrice
                    price={product.price}
                    effectivePrice={product.effectivePrice}
                    hasPromotion={product.hasPromotion}
                    promoLabel={product.promoLabel}
                    showBadge
                  />
                </div>
                {out ? (
                  <p className="text-[10px] font-bold text-red-400 mt-2">Agotado</p>
                ) : (
                  <p className="text-[10px] font-bold text-primary mt-2">
                    Toca para agregar · Desliza → descripción
                  </p>
                )}
              </button>

              <div className="flex w-full shrink-0 snap-start snap-always flex-col p-3 min-h-[7.25rem] max-h-[10rem] overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary mb-1.5">
                  Descripción
                </p>
                <ProductDescription
                  description={product.description}
                  className="text-xs flex-1"
                />
                <p className="text-[10px] text-text-secondary mt-2 shrink-0">
                  Desliza ← para volver
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-1.5 pb-2.5 pt-0.5">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={index === 0 ? 'Ver producto' : 'Ver descripción'}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeSlide === index
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-border hover:bg-primary/40'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={out}
            onClick={handleAdd}
            className={`flex flex-1 flex-col p-3 text-left transition ${
              out
                ? 'cursor-not-allowed'
                : 'active:scale-[0.98] hover:border-primary/25'
            }`}
          >
            <p className="font-bold text-foreground text-sm leading-tight">
              {product.name}
            </p>
            <div className="mt-auto pt-2">
              <ProductPrice
                price={product.price}
                effectivePrice={product.effectivePrice}
                hasPromotion={product.hasPromotion}
                promoLabel={product.promoLabel}
                showBadge
              />
            </div>
            {out && (
              <p className="text-[10px] font-bold text-red-400 mt-2">Agotado</p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
