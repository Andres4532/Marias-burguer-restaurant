'use client';

import { useCallback, useState } from 'react';
import type { CatalogCategory } from '@/types/catalog';
import type { CartSauce, useCart } from '@/hooks/useCart';
import { productNeedsPromoChoice } from '@/lib/product-pricing';
import { productNeedsSaucePicker } from '@/components/pos/SaucePickerModal';
import type { OrderType } from '@/types/orders';

type CatalogProduct = CatalogCategory['products'][number];
type Cart = ReturnType<typeof useCart>;

export function useProductAddModals(cart: Cart, orderType: OrderType) {
  const [promoPickerProduct, setPromoPickerProduct] =
    useState<CatalogProduct | null>(null);
  const [saucePickerProduct, setSaucePickerProduct] =
    useState<CatalogProduct | null>(null);
  const [pendingApplyPromo, setPendingApplyPromo] = useState(true);

  const finishAdd = useCallback(
    (
      product: CatalogProduct,
      sauces: CartSauce[],
      noSauce: boolean,
      applyPromo: boolean,
    ) => {
      cart.addItem(product, [], sauces, undefined, noSauce, applyPromo);
    },
    [cart],
  );

  const continueAfterPromo = useCallback(
    (product: CatalogProduct, applyPromo: boolean) => {
      if (productNeedsSaucePicker(product, orderType)) {
        setPendingApplyPromo(applyPromo);
        setSaucePickerProduct(product);
        return;
      }
      finishAdd(product, [], false, applyPromo);
    },
    [finishAdd, orderType],
  );

  const tryAddProduct = useCallback(
    (product: CatalogProduct) => {
      if (productNeedsPromoChoice(product)) {
        setPromoPickerProduct(product);
        return;
      }
      continueAfterPromo(product, true);
    },
    [continueAfterPromo],
  );

  const handlePromoConfirm = useCallback(
    (applyPromo: boolean) => {
      if (!promoPickerProduct) return;
      const product = promoPickerProduct;
      setPromoPickerProduct(null);
      continueAfterPromo(product, applyPromo);
    },
    [promoPickerProduct, continueAfterPromo],
  );

  const handleSauceConfirm = useCallback(
    (sauces: CartSauce[], noSauce: boolean) => {
      if (!saucePickerProduct) return;
      finishAdd(saucePickerProduct, sauces, noSauce, pendingApplyPromo);
      setSaucePickerProduct(null);
    },
    [saucePickerProduct, pendingApplyPromo, finishAdd],
  );

  return {
    promoPickerProduct,
    saucePickerProduct,
    setPromoPickerProduct,
    setSaucePickerProduct,
    tryAddProduct,
    handlePromoConfirm,
    handleSauceConfirm,
  };
}
