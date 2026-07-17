'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ExtraModal } from '@/components/pos/ExtraModal';
import { CartPanel } from '@/components/pos/CartPanel';
import { MobileCartBar, MobileCartDrawer } from '@/components/pos/MobileCartDrawer';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { FormError } from '@/components/ui/CrudForm';
import { useCart } from '@/hooks/useCart';
import {
  getPublicMenu,
  createPublicOrder,
  getPublicMenuErrorMessage,
} from '@/lib/public-menu';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { isDeliveryLocationComplete } from '@/lib/maps';
import { ProductImage } from '@/components/ui/ProductImage';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import { formatPrice } from '@/lib/catalog';
import type { CatalogCategory } from '@/types/catalog';
import type { OrderType } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'PARA_LLEVAR', label: '🥡 Para llevar' },
  { value: 'DELIVERY', label: '🛵 Delivery' },
];

export default function PublicMenuPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const cart = useCart();
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [extraModalProduct, setExtraModalProduct] = useState<CatalogProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('PARA_LLEVAR');

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicMenu(slug);
      setRestaurantName(data.restaurant.name);
      setRestaurantLogo(data.restaurant.logoUrl);
      setCatalog(data.categories);
      if (data.categories.length > 0) {
        setActiveCategory(data.categories[0].id);
      }
    } catch (e) {
      setError(getPublicMenuErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

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

    if (!customerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setError('Ingresa un teléfono válido');
      return;
    }

    if (orderType === 'DELIVERY') {
      if (
        !isDeliveryLocationComplete(
          deliveryAddress,
          deliveryLatitude,
          deliveryLongitude,
        )
      ) {
        setError('Marca tu ubicación en el mapa o ingresa la dirección');
        return;
      }
    }

    if (cart.items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSubmitting(true);
    try {
      const order = await createPublicOrder(slug, {
        type: orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress:
          orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
        deliveryReference:
          orderType === 'DELIVERY'
            ? deliveryReference.trim() || undefined
            : undefined,
        deliveryLatitude:
          orderType === 'DELIVERY' && deliveryLatitude != null
            ? deliveryLatitude
            : undefined,
        deliveryLongitude:
          orderType === 'DELIVERY' && deliveryLongitude != null
            ? deliveryLongitude
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
      router.push(
        `/menu/${slug}/exito?n=${order.orderNumber}&total=${order.total}`,
      );
    } catch (e) {
      setError(getPublicMenuErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = catalog.find((c) => c.id === activeCategory);

  const customerFields = (
    <div className="space-y-4 mb-4">
      <div>
        <p className="text-sm font-bold text-foreground mb-2">Tipo de pedido</p>
        <div className="flex gap-2 flex-wrap">
          {ORDER_TYPES.map(({ value, label }) => (
            <FilterChip
              key={value}
              active={orderType === value}
              onClick={() => setOrderType(value)}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      {orderType === 'DELIVERY' ? (
        <DeliveryFormFields
          customerName={customerName}
          customerPhone={customerPhone}
          deliveryAddress={deliveryAddress}
          deliveryReference={deliveryReference}
          deliveryLatitude={deliveryLatitude}
          deliveryLongitude={deliveryLongitude}
          onCustomerNameChange={setCustomerName}
          onCustomerPhoneChange={setCustomerPhone}
          onDeliveryAddressChange={setDeliveryAddress}
          onDeliveryReferenceChange={setDeliveryReference}
          onDeliveryLocationChange={(lat, lng) => {
            setDeliveryLatitude(lat);
            setDeliveryLongitude(lng);
          }}
        />
      ) : (
        <>
          <Input
            label="Tu nombre"
            placeholder="Ej: Juan Pérez"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <Input
            label="Tu teléfono"
            placeholder="Ej: 70000000"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary font-medium">Cargando menú...</p>
      </div>
    );
  }

  if (error && catalog.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full text-center">
          <FormError message={error} />
          <p className="text-sm text-text-secondary mt-3">
            El menú no está disponible.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <RestaurantLogo
            name={restaurantName}
            logoUrl={restaurantLogo}
            subtitle="Pedido en línea · para llevar o delivery"
            size="lg"
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px] gap-5 lg:gap-6">
          <div className="space-y-4 min-w-0">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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

            {currentCategory?.products.length === 0 ? (
              <Card className="text-center py-10">
                <p className="text-text-secondary font-medium">
                  No hay productos en esta categoría.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentCategory?.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden text-left hover:shadow-md hover:border-primary/25 active:scale-[0.98] transition"
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
                      <p className="text-primary font-extrabold mt-2">
                        {formatPrice(product.price)}
                      </p>
                      {product.extras.length > 0 && (
                        <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-wide">
                          + extras
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block min-w-0">
            <Card className="sticky top-24" padding="lg">
              {customerFields}
              <CartPanel
                cart={cart}
                error={error}
                submitting={submitting}
                onSubmit={handleSubmit}
                submitLabel="Enviar pedido"
              />
            </Card>
          </div>
        </div>
      </main>

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
        submitLabel="Enviar pedido"
        header={customerFields}
        wide
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
