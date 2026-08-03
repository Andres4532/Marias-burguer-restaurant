'use client';

import { useState, useCallback } from 'react';
import type { Order, OrderType } from '@/types/orders';

export interface CartExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  key: string;
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  extras: CartExtra[];
  notes?: string;
}

function itemKey(productId: string, extraIds: string[]) {
  return `${productId}:${extraIds.sort().join(',')}`;
}

function unitPrice(item: CartItem) {
  const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
  return item.basePrice + extrasTotal;
}

export function useCart() {
  const [orderType, setOrderType] = useState<OrderType>('MESA');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      product: { id: string; name: string; price: number },
      extras: CartExtra[],
      notes?: string,
    ) => {
      const key = itemKey(
        product.id,
        extras.map((e) => e.id),
      );

      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            productName: product.name,
            basePrice: product.price,
            quantity: 1,
            extras,
            notes,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setOrderNotes('');
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setDeliveryReference('');
    setDeliveryLatitude(null);
    setDeliveryLongitude(null);
    setOrderType('MESA');
  }, []);

  const loadFromOrder = useCallback((order: Order) => {
    setOrderType('MESA');
    setCustomerName(order.customerName?.trim() || order.tableNumber?.trim() || '');
    setTableNumber('');
    setOrderNotes(order.notes ?? '');
    setCustomerPhone('');
    setDeliveryAddress('');
    setDeliveryReference('');
    setDeliveryLatitude(null);
    setDeliveryLongitude(null);
    setItems(
      order.items.map((item) => {
        const extraIds = item.extras.map((extra) => extra.extraId);
        const extrasTotal = item.extras.reduce((sum, extra) => sum + extra.price, 0);
        return {
          key: itemKey(item.productId, extraIds),
          productId: item.productId,
          productName: item.productName,
          basePrice: item.unitPrice - extrasTotal,
          quantity: item.quantity,
          extras: item.extras.map((extra) => ({
            id: extra.extraId,
            name: extra.extraName,
            price: extra.price,
          })),
          notes: item.notes ?? undefined,
        };
      }),
    );
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + unitPrice(item) * item.quantity,
    0,
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    orderType,
    setOrderType,
    tableNumber,
    setTableNumber,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    deliveryAddress,
    setDeliveryAddress,
    deliveryReference,
    setDeliveryReference,
    deliveryLatitude,
    setDeliveryLatitude,
    deliveryLongitude,
    setDeliveryLongitude,
    orderNotes,
    setOrderNotes,
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    loadFromOrder,
    subtotal,
    itemCount,
    unitPrice,
  };
}
