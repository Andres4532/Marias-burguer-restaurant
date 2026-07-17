'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FilterChip } from '@/components/ui/FilterChip';
import { ExtraModal } from '@/components/pos/ExtraModal';
import { CartPanel } from '@/components/pos/CartPanel';
import { MobileCartBar, MobileCartDrawer } from '@/components/pos/MobileCartDrawer';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { isDeliveryLocationComplete } from '@/lib/maps';
import { ProductImage } from '@/components/ui/ProductImage';
import { useCart } from '@/hooks/useCart';
import { getCatalog, formatPrice, getErrorMessage } from '@/lib/catalog';
import { createOrder } from '@/lib/orders';
import type { CatalogCategory } from '@/types/catalog';
import type { OrderType } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'MESA', label: '🪑 Mesa' },
  { value: 'PARA_LLEVAR', label: '🥡 Para llevar' },
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
  const [extraModalProduct, setExtraModalProduct] = useState<CatalogProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalog();
      setCatalog(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleProductClick = (product: CatalogProduct) => {
    if (product.extras.length > 0) {
      setExtraModalProduct(product);
    } else {
      cart.addItem(product, []);
    }
  };

  const handleConfirmExtras = (
    product: CatalogProduct,
    extras: Array<{ id: string; name: string; price: number }>,
  ) => {
    cart.addItem(product, extras);
  };

  const handleSubmit = async () => {
    setError('');

    if (cart.orderType === 'MESA' && !cart.tableNumber.trim()) {
      setError('Ingresa el número de mesa');
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
        tableNumber:
          cart.orderType === 'MESA' ? cart.tableNumber.trim() : undefined,
        customerName:
          cart.orderType === 'DELIVERY' ? cart.customerName.trim() : undefined,
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
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          extraIds: item.extras.map((e) => e.id),
          notes: item.notes,
        })),
      });
      cart.clearCart();
      setCartOpen(false);
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

            {cart.orderType === 'MESA' && (
              <div className="mt-4">
                <Input
                  label="Número de mesa"
                  placeholder="Ej: 5"
                  value={cart.tableNumber}
                  onChange={(e) => cart.setTableNumber(e.target.value)}
                />
              </div>
            )}

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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentCategory?.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="rounded-xl border border-border bg-background overflow-hidden text-left active:scale-[0.98] hover:shadow-md hover:border-primary/30 transition"
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      aspect="video"
                      className="rounded-none"
                    />
                    <div className="p-3">
                      <p className="font-bold text-foreground text-sm leading-tight">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <span className="text-primary font-extrabold text-sm">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                          Agregar
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
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
      />

      <ExtraModal
        product={extraModalProduct}
        open={!!extraModalProduct}
        onClose={() => setExtraModalProduct(null)}
        onConfirm={handleConfirmExtras}
      />
    </div>
  );
}
