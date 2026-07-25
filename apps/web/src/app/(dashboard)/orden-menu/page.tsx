'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { ProductImage } from '@/components/ui/ProductImage';
import { FormError } from '@/components/ui/CrudForm';
import {
  getCategories,
  getProducts,
  updateProduct,
  formatPrice,
  getErrorMessage,
} from '@/lib/catalog';
import type { Category, Product } from '@/types/catalog';
import { sortByMenuOrder, swapMenuPosition } from '@/lib/sort-order';

export default function OrdenMenuPage() {
  const { loading, isJefa } = useRequireJefa();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoadingData(true);
    setError('');
    try {
      const [cats, prods] = await Promise.all([
        getCategories(true),
        getProducts(undefined, true),
      ]);
      const sortedCats = sortByMenuOrder(cats);
      setCategories(sortedCats);
      setProducts(prods);
      setActiveCategoryId((prev) => {
        if (prev && sortedCats.some((c) => c.id === prev)) return prev;
        return sortedCats[0]?.id ?? '';
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const productsInCategory = useMemo(() => {
    const inCat = products.filter((p) => p.categoryId === activeCategoryId);
    return sortByMenuOrder(inCat);
  }, [products, activeCategoryId]);

  const rankByProductId = useMemo(() => {
    const map = new Map<string, number>();
    productsInCategory.forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [productsInCategory]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productsInCategory;
    return productsInCategory.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [productsInCategory, search]);

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    const updates = swapMenuPosition(productsInCategory, productId, direction);
    if (!updates) return;

    setMovingId(productId);
    setError('');
    try {
      await Promise.all(
        updates.map((u) => updateProduct(u.id, { sortOrder: u.sortOrder })),
      );
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setMovingId(null);
    }
  };

  if (loading || !isJefa) {
    return (
      <div className="flex justify-center py-12">
        <p className="font-medium text-text-secondary">Cargando...</p>
      </div>
    );
  }

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div>
      <PageHeader
        title="Orden del menú"
        description="Define en qué orden aparecen los productos en el POS y en el menú público (de arriba hacia abajo, por categoría)."
      />

      {error && (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      )}

      {loadingData ? (
        <Card>
          <p className="text-text-secondary">Cargando catálogo...</p>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <p className="text-text-secondary">
            Crea categorías y productos primero.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card padding="md">
            <p className="mb-3 text-sm font-bold text-foreground">Categoría</p>
            <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1">
              {sortByMenuOrder(categories).map((cat) => (
                <FilterChip
                  key={cat.id}
                  active={activeCategoryId === cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setSearch('');
                  }}
                >
                  {cat.name}
                </FilterChip>
              ))}
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-border px-4 py-3 sm:px-5 space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {activeCategory?.name ?? 'Productos'}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  El #1 es el primero que ven en la lista del menú.
                </p>
              </div>
              <Input
                type="search"
                label="Buscar producto"
                placeholder="Nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>

            {productsInCategory.length === 0 ? (
              <p className="p-6 text-sm text-text-secondary">
                No hay productos en esta categoría.
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-6 text-sm text-text-secondary">
                Ningún producto coincide con &quot;{search.trim()}&quot;.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const rank = rankByProductId.get(product.id) ?? 0;
                  const isFirst = rank === 1;
                  const isLast = rank === productsInCategory.length;
                  const busy = movingId === product.id;

                  return (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                        {rank}
                      </span>
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        aspect="square"
                        className="size-12 shrink-0 sm:size-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground">
                          {product.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-primary">
                            {formatPrice(product.price)}
                          </span>
                          <Badge active={product.isActive} />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isFirst || busy || movingId != null}
                          onClick={() => moveProduct(product.id, 'up')}
                          aria-label={`Subir ${product.name}`}
                          className="min-w-[2.75rem] px-2"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isLast || busy || movingId != null}
                          onClick={() => moveProduct(product.id, 'down')}
                          aria-label={`Bajar ${product.name}`}
                          className="min-w-[2.75rem] px-2"
                        >
                          ↓
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
