'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { CartPanel } from '@/components/pos/CartPanel';
import { MobileCartBar, MobileCartDrawer } from '@/components/pos/MobileCartDrawer';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { isDeliveryLocationComplete } from '@/lib/maps';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart } from '@/hooks/useCart';
import { getCatalog, getErrorMessage } from '@/lib/catalog';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import { createOrder } from '@/lib/orders';
import { cartItemsToOrderInput } from '@/lib/cart-order';
import {
  SaucePickerModal,
  productNeedsSaucePicker,
} from '@/components/pos/SaucePickerModal';
import {
  canAddOneToCart,
  isOutOfStock,
  maxQuantityForCartLine,
} from '@/lib/inventory';
import type { CartSauce } from '@/hooks/useCart';
import type { CatalogCategory } from '@/types/catalog';
import type { OrderType } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'MESA', label: '🪑 Mesa' },
  { value: 'PARA_LLEVAR', label: '🥡 Para recojo' },
  { value: 'DELIVERY', label: '🛵 Delivery' },
];

export default function PosPage() {
  const router = useRouter();
  const cart = useCart();
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [saucePickerProduct, setSaucePickerProduct] =
    useState<CatalogProduct | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalog();
      setCatalog(data.categories);
      if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const cat of catalog) {
      for (const p of cat.products) map.set(p.id, p);
    }
    return map;
  }, [catalog]);

  const getMaxQuantity = useCallback(
    (item: { key: string; productId: string }) => {
      const product = productById.get(item.productId);
      if (!product) return Number.POSITIVE_INFINITY;
      return maxQuantityForCartLine(product, cart.items, item.key);
    },
    [productById, cart.items],
  );

  const tryAddProduct = (product: CatalogProduct) => {
    if (isOutOfStock(product)) {
      setError(`"${product.name}" está agotado`);
      return;
    }
    if (!canAddOneToCart(product, cart.items)) {
      setError(`No hay más unidades de "${product.name}" en inventario`);
      return;
    }
    setError('');
    if (productNeedsSaucePicker(product)) {
      setSaucePickerProduct(product);
      return;
    }
    cart.addItem(product, []);
  };

  const handleSauceConfirm = (sauces: CartSauce[]) => {
    if (!saucePickerProduct) return;
    cart.addItem(saucePickerProduct, [], sauces);
    setSaucePickerProduct(null);
  };

  const handleProductClick = (product: CatalogProduct) => {
    tryAddProduct(product);
  };

  const handleSubmit = async () => {
    setError('');

    if (
      (cart.orderType === 'MESA' || cart.orderType === 'PARA_LLEVAR') &&
      !cart.customerName.trim()
    ) {
      setError(
        cart.orderType === 'MESA'
          ? 'Ingresa el nombre por el que llaman'
          : 'Ingresa el nombre para recojo',
      );
      return;
    }

    if (cart.orderType === 'DELIVERY') {
      if (!cart.customerName.trim()) {
        setError('Ingresa el nombre del cliente');
        return;
      }
      if (!cart.customerPhone.trim() || cart.customerPhone.trim().length < 6) {
        setError('Ingresa un teléfono válido');
        return;
      }
      if (
        !isDeliveryLocationComplete(
          cart.deliveryAddress,
          cart.deliveryLatitude,
          cart.deliveryLongitude,
        )
      ) {
        setError('Marca la ubicación en el mapa o ingresa la dirección');
        return;
      }
    }

    if (cart.items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        type: cart.orderType,
        customerName:
          cart.orderType === 'MESA' ||
          cart.orderType === 'PARA_LLEVAR' ||
          cart.orderType === 'DELIVERY'
            ? cart.customerName.trim()
            : undefined,
        customerPhone:
          cart.orderType === 'DELIVERY' ? cart.customerPhone.trim() : undefined,
        deliveryAddress:
          cart.orderType === 'DELIVERY' ? cart.deliveryAddress.trim() : undefined,
        deliveryReference:
          cart.orderType === 'DELIVERY'
            ? cart.deliveryReference.trim() || undefined
            : undefined,
        deliveryLatitude:
          cart.orderType === 'DELIVERY' && cart.deliveryLatitude != null
            ? cart.deliveryLatitude
            : undefined,
        deliveryLongitude:
          cart.orderType === 'DELIVERY' && cart.deliveryLongitude != null
            ? cart.deliveryLongitude
            : undefined,
        notes: cart.orderNotes || undefined,
        items: cartItemsToOrderInput(cart.items),
      });
      cart.clearCart();
      setCartOpen(false);
      void loadCatalog();
      router.push(`/cobro/${order.id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = catalog.find((c) => c.id === activeCategory);

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        title="Nuevo pedido"
        description="Selecciona tipo de pedido y productos"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-4">
          <Card>
            <p className="text-sm font-bold text-foreground mb-3">
              Tipo de pedido
            </p>
            <div className="flex gap-2 flex-wrap">
              {ORDER_TYPES.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  active={cart.orderType === value}
                  onClick={() => cart.setOrderType(value)}
                >
                  {label}
                </FilterChip>
              ))}
            </div>

            {cart.orderType === 'DELIVERY' && (
              <div className="mt-4">
                <DeliveryFormFields
                  customerName={cart.customerName}
                  customerPhone={cart.customerPhone}
                  deliveryAddress={cart.deliveryAddress}
                  deliveryReference={cart.deliveryReference}
                  deliveryLatitude={cart.deliveryLatitude}
                  deliveryLongitude={cart.deliveryLongitude}
                  onCustomerNameChange={cart.setCustomerName}
                  onCustomerPhoneChange={cart.setCustomerPhone}
                  onDeliveryAddressChange={cart.setDeliveryAddress}
                  onDeliveryReferenceChange={cart.setDeliveryReference}
                  onDeliveryLocationChange={(lat, lng) => {
                    cart.setDeliveryLatitude(lat);
                    cart.setDeliveryLongitude(lng);
                  }}
                />
              </div>
            )}
          </Card>

          {loading ? (
            <Card>
              <p className="text-text-secondary">Cargando menú...</p>
            </Card>
          ) : catalog.length === 0 ? (
            <Card>
              <p className="text-text-secondary">
                No hay productos. La jefa debe agregar productos primero.
              </p>
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
                  const out = isOutOfStock(product);
                  const showStock =
                    product.trackStock && product.stockQuantity > 0;
                  return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={out}
                    onClick={() => handleProductClick(product)}
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
                      {product.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 flex-wrap pt-3">
                        <ProductPrice
                          price={product.price}
                          effectivePrice={product.effectivePrice}
                          hasPromotion={product.hasPromotion}
                          promoLabel={product.promoLabel}
                          showBadge
                        />
                        {out ? (
                          <span className="text-[10px] font-bold text-red-300 bg-red-950/50 px-2 py-1 rounded-full">
                            Agotado
                          </span>
                        ) : showStock ? (
                          <span className="text-[10px] font-bold text-text-secondary bg-background border border-border px-2 py-1 rounded-full">
                            Quedan {product.stockQuantity}
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
      />

      <SaucePickerModal
        open={!!saucePickerProduct}
        product={saucePickerProduct}
        onClose={() => setSaucePickerProduct(null)}
        onConfirm={handleSauceConfirm}
      />
    </div>
  );
}
