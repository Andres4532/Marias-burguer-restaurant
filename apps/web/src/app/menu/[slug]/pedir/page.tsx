'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CartPanel } from '@/components/pos/CartPanel';
import { MobileCartBar, MobileCartDrawer } from '@/components/pos/MobileCartDrawer';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { FormError } from '@/components/ui/CrudForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import {
  getPublicMenu,
  createPublicOrder,
  getPublicMenuErrorMessage,
  uploadPublicPaymentProof,
} from '@/lib/public-menu';
import { normalizeMediaUrl } from '@/lib/media-url';
import { downloadMediaFile } from '@/lib/download-media';
import { DeliveryFormFields } from '@/components/orders/DeliveryFormFields';
import { isDeliveryLocationComplete } from '@/lib/maps';
import { ProductImage } from '@/components/ui/ProductImage';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import { formatPrice } from '@/lib/catalog';
import { ProductPrice } from '@/components/catalog/ProductPrice';
import {
  canAddOneToCart,
  isOutOfStock,
  maxQuantityForCartLine,
} from '@/lib/inventory';
import { cartItemsToOrderInput } from '@/lib/cart-order';
import {
  SaucePickerModal,
  productNeedsSaucePicker,
} from '@/components/pos/SaucePickerModal';
import type { CartSauce } from '@/hooks/useCart';
import type { CatalogCategory } from '@/types/catalog';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];

const ORDER_TYPE_EMOJI: Record<'PARA_LLEVAR' | 'DELIVERY', string> = {
  PARA_LLEVAR: '🥡',
  DELIVERY: '🛵',
};

function parseMenuOrderType(value: string | null): 'PARA_LLEVAR' | 'DELIVERY' | null {
  if (value === 'PARA_LLEVAR' || value === 'DELIVERY') return value;
  return null;
}

export default function PublicMenuOrderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderType = parseMenuOrderType(searchParams.get('tipo'));
  const cart = useCart();
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [saucePickerProduct, setSaucePickerProduct] =
    useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (!orderType) {
      router.replace(`/menu/${slug}`);
    }
  }, [orderType, router, slug]);

  useEffect(() => {
    if (orderType) {
      cart.setOrderType(orderType);
    }
  }, [orderType, cart.setOrderType]);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicMenu(slug);
      setRestaurantName(data.restaurant.name);
      setRestaurantLogo(data.restaurant.logoUrl);
      setQrImageUrl(data.restaurant.qrImageUrl);
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
    if (orderType) {
      loadMenu();
    }
  }, [loadMenu, orderType]);

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

  const handleProductClick = (product: CatalogProduct) => {
    if (isOutOfStock(product)) {
      setError(`"${product.name}" no está disponible por ahora`);
      return;
    }
    if (!canAddOneToCart(product, cart.items)) {
      setError(`No puedes agregar más unidades de "${product.name}"`);
      return;
    }
    setError('');
    if (orderType && productNeedsSaucePicker(product, orderType)) {
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

  const validateBeforeSubmit = (): boolean => {
    if (!orderType) return false;

    setError('');

    if (!customerName.trim()) {
      setError('Ingresa tu nombre');
      return false;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 6) {
      setError('Ingresa un teléfono válido');
      return false;
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
        return false;
      }
    }

    if (cart.items.length === 0) {
      setError('Agrega al menos un producto');
      return false;
    }

    return true;
  };

  const handleSubmitClick = async () => {
    if (!validateBeforeSubmit()) {
      setCartOpen(true);
      return;
    }
    try {
      const data = await getPublicMenu(slug);
      setQrImageUrl(data.restaurant.qrImageUrl);
    } catch {
      // Si falla la recarga, usamos el QR ya cargado al entrar al menú.
    }
    setPaymentMethod('EFECTIVO');
    setProofFile(null);
    setCartOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!orderType || !validateBeforeSubmit()) {
      setConfirmOpen(false);
      return;
    }

    if (paymentMethod === 'QR') {
      if (!qrImageUrl) {
        setError('El pago por QR no está disponible. Elige efectivo.');
        return;
      }
      if (!proofFile) {
        setError('Sube la captura del comprobante de pago');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      let paymentProofUrl: string | undefined;
      if (paymentMethod === 'QR' && proofFile) {
        paymentProofUrl = await uploadPublicPaymentProof(slug, proofFile);
      }

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
        paymentMethod,
        paymentProofUrl,
        items: cartItemsToOrderInput(cart.items),
      });
      cart.clearCart();
      setCartOpen(false);
      setConfirmOpen(false);
      void loadMenu();
      const track = order.publicTrackingToken;
      if (track) {
        router.push(`/menu/${slug}/seguimiento/${track}`);
      } else {
        router.push(
          `/menu/${slug}/exito?n=${order.orderNumber}&total=${order.total}`,
        );
      }
    } catch (e) {
      setError(getPublicMenuErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = catalog.find((c) => c.id === activeCategory);

  const orderTypeBanner = orderType ? (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <p className="text-sm font-bold text-foreground">
        {ORDER_TYPE_EMOJI[orderType]} {ORDER_TYPE_LABELS[orderType]}
      </p>
      <Link
        href={`/menu/${slug}`}
        className="text-xs font-bold text-primary hover:underline"
      >
        Cambiar tipo
      </Link>
    </div>
  ) : null;

  const customerFields = orderType ? (
    <div className="space-y-4 mb-4">
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
  ) : null;

  if (!orderType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary font-medium">Redirigiendo...</p>
      </div>
    );
  }

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
          <Link
            href={`/menu/${slug}`}
            className="inline-block mt-4 text-sm font-bold text-primary hover:underline"
          >
            Volver al inicio
          </Link>
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
            subtitle={`Pedido en línea · ${ORDER_TYPE_LABELS[orderType].toLowerCase()}`}
            size="lg"
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="mb-4">{orderTypeBanner}</div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-stretch">
                {currentCategory?.products.map((product) => {
                  const out = isOutOfStock(product);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={out}
                      onClick={() => handleProductClick(product)}
                      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition ${
                        out
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-primary/25 hover:shadow-md active:scale-[0.98]'
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
                          <p className="text-[10px] font-bold text-red-400 mt-2">
                            Agotado
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
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
                onSubmit={handleSubmitClick}
                submitLabel="Enviar pedido"
                getMaxQuantity={getMaxQuantity}
              />
            </Card>
          </div>
        </div>
      </main>

      <Modal
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        title="¿Confirmar pedido?"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Revisa los datos antes de enviar tu pedido al restaurante.
          </p>
          <div className="rounded-xl border border-border bg-background/50 p-3 text-sm space-y-1">
            <p>
              <span className="text-text-secondary">Tipo: </span>
              <span className="font-semibold text-foreground">
                {ORDER_TYPE_LABELS[orderType]}
              </span>
            </p>
            <p>
              <span className="text-text-secondary">Nombre: </span>
              <span className="font-semibold text-foreground">
                {customerName.trim()}
              </span>
            </p>
            <p>
              <span className="text-text-secondary">Teléfono: </span>
              <span className="font-semibold text-foreground">
                {customerPhone.trim()}
              </span>
            </p>
            {orderType === 'DELIVERY' && deliveryAddress.trim() && (
              <p>
                <span className="text-text-secondary">Dirección: </span>
                <span className="font-semibold text-foreground">
                  {deliveryAddress.trim()}
                </span>
              </p>
            )}
            {orderType === 'DELIVERY' && deliveryReference.trim() && (
              <p>
                <span className="text-text-secondary">Referencia: </span>
                <span className="text-foreground">{deliveryReference.trim()}</span>
              </p>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {cart.items.map((item) => {
              const unit =
                item.basePrice +
                item.extras.reduce((s, e) => s + e.price, 0);
              return (
                <li
                  key={item.key}
                  className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-foreground">
                    {item.quantity}× {item.productName}
                  </span>
                  <span className="font-semibold text-foreground shrink-0">
                    {formatPrice(unit * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
          {cart.orderNotes.trim() && (
            <p className="text-sm">
              <span className="text-text-secondary">Nota: </span>
              {cart.orderNotes.trim()}
            </p>
          )}
          <p className="flex justify-between items-center pt-1 text-base font-extrabold text-foreground">
            <span>Total</span>
            <span className="text-primary">{formatPrice(cart.subtotal)}</span>
          </p>
          <p className="flex justify-between items-center pt-1 text-base font-extrabold text-foreground">
            <span>Total</span>
            <span className="text-primary">{formatPrice(cart.subtotal)}</span>
          </p>

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-bold text-foreground">Forma de pago</p>
            <div className="flex gap-2 flex-wrap">
              <FilterChip
                active={paymentMethod === 'EFECTIVO'}
                onClick={() => {
                  setPaymentMethod('EFECTIVO');
                  setProofFile(null);
                  setError('');
                }}
              >
                💵 {PAYMENT_METHOD_LABELS.EFECTIVO} al recibir
              </FilterChip>
              {qrImageUrl && (
                <FilterChip
                  active={paymentMethod === 'QR'}
                  onClick={() => {
                    setPaymentMethod('QR');
                    setError('');
                  }}
                >
                  📱 {PAYMENT_METHOD_LABELS.QR}
                </FilterChip>
              )}
            </div>

            {paymentMethod === 'QR' && qrImageUrl && (
              <div className="space-y-3 rounded-xl border border-border bg-background/50 p-3">
                <p className="text-sm text-text-secondary">
                  Escanea el QR, paga el total y sube el comprobante.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizeMediaUrl(qrImageUrl) ?? qrImageUrl}
                  alt="Código QR de pago"
                  className="mx-auto max-h-56 w-auto rounded-lg object-contain bg-white p-2"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={downloadingQr}
                  onClick={() => {
                    setDownloadingQr(true);
                    setError('');
                    void downloadMediaFile(
                      normalizeMediaUrl(qrImageUrl) ?? qrImageUrl,
                      'qr-pago.jpg',
                    )
                      .catch(() => {
                        setError(
                          'No se pudo descargar el QR. Mantén presionada la imagen para guardarla.',
                        );
                      })
                      .finally(() => setDownloadingQr(false));
                  }}
                >
                  {downloadingQr ? 'Descargando…' : 'Descargar QR'}
                </Button>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    Comprobante de pago
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-primary"
                    onChange={(e) => {
                      setProofFile(e.target.files?.[0] ?? null);
                      setError('');
                    }}
                  />
                </label>
                {proofFile && (
                  <p className="text-xs text-text-secondary">
                    Archivo: {proofFile.name}
                  </p>
                )}
              </div>
            )}
          </div>

          {error && <FormError message={error} />}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="sm:flex-1"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
            >
              Volver
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              disabled={submitting}
              onClick={() => void handleConfirmSubmit()}
            >
              {submitting ? 'Enviando…' : 'Sí, enviar pedido'}
            </Button>
          </div>
        </div>
      </Modal>

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
        onSubmit={handleSubmitClick}
        submitLabel="Enviar pedido"
        header={customerFields}
        wide
        getMaxQuantity={getMaxQuantity}
      />

      <SaucePickerModal
        open={!!saucePickerProduct}
        product={saucePickerProduct}
        orderType={orderType ?? 'PARA_LLEVAR'}
        onClose={() => setSaucePickerProduct(null)}
        onConfirm={handleSauceConfirm}
      />
    </div>
  );
}
