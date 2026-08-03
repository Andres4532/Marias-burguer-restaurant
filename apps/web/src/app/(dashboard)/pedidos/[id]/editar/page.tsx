'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { CartPanel } from '@/components/pos/CartPanel';
import { MobileCartBar, MobileCartDrawer } from '@/components/pos/MobileCartDrawer';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart } from '@/hooks/useCart';
import { getCatalog, formatPrice, getErrorMessage } from '@/lib/catalog';
import {
  getOrder,
  updateMesaOrder,
  formatOrderNumber,
} from '@/lib/orders';
import {
  canAddOneToCart,
  isOutOfStock,
  maxQuantityForCartLine,
} from '@/lib/inventory';
import { canEditOrder } from '@/types/orders';
import type { CatalogCategory } from '@/types/catalog';
import type { Order } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];

export default function EditarPedidoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();
  const { loadFromOrder } = cart;
  const [order, setOrder] = useState<Order | null>(null);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const reservedByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of order?.items ?? []) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    }
    return map;
  }, [order]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orderData, catalogData] = await Promise.all([
        getOrder(id),
        getCatalog(),
      ]);

      if (!canEditOrder(orderData)) {
        setError('Este pedido no se puede editar. Solo mesas pendientes de cobro.');
        setOrder(orderData);
        return;
      }

      setOrder(orderData);
      loadFromOrder(orderData);
      setCatalog(catalogData.categories);
      if (catalogData.categories.length > 0) {
        setActiveCategory(catalogData.categories[0].id);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id, loadFromOrder]);

  useEffect(() => {
    void load();
  }, [load]);

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const cat of catalog) {
      for (const product of cat.products) map.set(product.id, product);
    }
    return map;
  }, [catalog]);

  const withReservedStock = useCallback(
    (product: CatalogProduct): CatalogProduct => {
      const reserved = reservedByProduct.get(product.id) ?? 0;
      if (!product.trackStock || reserved === 0) return product;
      return {
        ...product,
        stockQuantity: (product.stockQuantity ?? 0) + reserved,
      };
    },
    [reservedByProduct],
  );

  const getMaxQuantity = useCallback(
    (item: { key: string; productId: string }) => {
      const product = productById.get(item.productId);
      if (!product) return Number.POSITIVE_INFINITY;
      return maxQuantityForCartLine(
        withReservedStock(product),
        cart.items,
        item.key,
      );
    },
    [productById, cart.items, withReservedStock],
  );

  const tryAddProduct = (product: CatalogProduct) => {
    const adjusted = withReservedStock(product);
    if (isOutOfStock(adjusted)) {
      setError(`"${product.name}" está agotado`);
      return;
    }
    if (!canAddOneToCart(adjusted, cart.items)) {
      setError(`No hay más unidades de "${product.name}" en inventario`);
      return;
    }
    setError('');
    cart.addItem(product, []);
  };

  const handleSubmit = async () => {
    setError('');

    if (!cart.tableNumber.trim()) {
      setError('Ingresa el número de mesa');
      return;
    }

    if (cart.items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSubmitting(true);
    try {
      await updateMesaOrder(id, {
        tableNumber: cart.tableNumber.trim(),
        notes: cart.orderNotes || undefined,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          extraIds: item.extras.length ? item.extras.map((e) => e.id) : undefined,
          notes: item.notes,
        })),
      });
      router.push(`/pedidos/${id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-text-secondary py-12 text-center font-medium">
        Cargando pedido...
      </p>
    );
  }

  if (error && !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">{error}</p>
        <Link
          href="/pedidos"
          className="text-primary text-sm font-bold mt-3 inline-block hover:underline"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (!order || !canEditOrder(order)) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-red-600 font-medium">
          {error || 'Este pedido no se puede editar.'}
        </p>
        <p className="text-sm text-text-secondary">
          Solo pedidos de mesa pendientes de cobro.
        </p>
        <Link href={`/pedidos/${id}`}>
          <Button variant="secondary">Volver al pedido</Button>
        </Link>
      </div>
    );
  }

  const currentCategory = catalog.find((cat) => cat.id === activeCategory);

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        title={`Editar ${formatOrderNumber(order.orderNumber)}`}
        description="Solo pedidos de mesa antes del cobro"
        action={
          <Link href={`/pedidos/${id}`}>
            <Button variant="secondary">Cancelar</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <Card>
            <p className="text-sm font-bold text-foreground mb-3">Mesa</p>
            <Input
              label="Número de mesa"
              placeholder="Ej: 5"
              value={cart.tableNumber}
              onChange={(e) => cart.setTableNumber(e.target.value)}
            />
          </Card>

          {catalog.length === 0 ? (
            <Card>
              <p className="text-text-secondary">No hay productos disponibles.</p>
            </Card>
          ) : (
            <Card padding="md">
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
                {catalog.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </FilterChip>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-stretch">
                {currentCategory?.products.map((product) => {
                  const adjusted = withReservedStock(product);
                  const out = isOutOfStock(adjusted);
                  const showStock =
                    product.trackStock && adjusted.stockQuantity > 0;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={out}
                      onClick={() => tryAddProduct(product)}
                      className={`flex h-full flex-col rounded-xl border border-border bg-background overflow-hidden text-left transition ${
                        out
                          ? 'opacity-50 cursor-not-allowed'
                          : 'active:scale-[0.98] hover:shadow-md hover:border-primary/30'
                      }`}
                    >
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        aspect="menu"
                        className="w-full shrink-0 rounded-none"
                      />
                      <div className="flex flex-1 flex-col p-3">
                        <p className="font-bold text-foreground text-sm leading-tight">
                          {product.name}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-2 flex-wrap pt-3">
                          <span className="text-primary font-extrabold text-sm">
                            {formatPrice(product.price)}
                          </span>
                          {out ? (
                            <span className="text-[10px] font-bold text-red-300 bg-red-950/50 px-2 py-1 rounded-full">
                              Agotado
                            </span>
                          ) : showStock ? (
                            <span className="text-[10px] font-bold text-text-secondary bg-background border border-border px-2 py-1 rounded-full">
                              Quedan {adjusted.stockQuantity}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                              Agregar
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <Card className="hidden xl:block h-fit sticky top-24">
          <CartPanel
            cart={cart}
            error={error}
            submitting={submitting}
            onSubmit={handleSubmit}
            getMaxQuantity={getMaxQuantity}
            submitLabel="Guardar cambios"
          />
        </Card>
      </div>

      <MobileCartBar
        itemCount={cart.itemCount}
        total={cart.subtotal}
        onOpen={() => setCartOpen(true)}
      />

      <MobileCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        error={error}
        submitting={submitting}
        onSubmit={handleSubmit}
        getMaxQuantity={getMaxQuantity}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
