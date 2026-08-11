'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { subscribeEntrantesStream } from '@/lib/entrantes-stream';
import { getOrders } from '@/lib/orders';
import {
  playNewOrderAlert,
  requestNotificationPermission,
  showNewOrderNotification,
  unlockAudio,
} from '@/lib/notifications';

interface EntrantesAlertsContextValue {
  live: boolean;
  newOrderCount: number;
  deliveryNewCount: number;
  resetRecojoNewCount: () => void;
  resetDeliveryNewCount: () => void;
  resetNewOrderCount: () => void;
}

const EntrantesAlertsContext = createContext<EntrantesAlertsContextValue>({
  live: false,
  newOrderCount: 0,
  deliveryNewCount: 0,
  resetRecojoNewCount: () => {},
  resetDeliveryNewCount: () => {},
  resetNewOrderCount: () => {},
});

export function useEntrantesAlerts() {
  return useContext(EntrantesAlertsContext);
}

export function EntrantesAlertsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [live, setLive] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [deliveryNewCount, setDeliveryNewCount] = useState(0);
  const knownIds = useRef(new Set<string>());

  const resetRecojoNewCount = useCallback(() => {
    setNewOrderCount(0);
  }, []);

  const resetDeliveryNewCount = useCallback(() => {
    setDeliveryNewCount(0);
  }, []);

  const resetNewOrderCount = useCallback(() => {
    setNewOrderCount(0);
    setDeliveryNewCount(0);
  }, []);

  useEffect(() => {
    let activated = false;

    const activateAlerts = () => {
      if (activated) return;
      activated = true;
      unlockAudio();
      void requestNotificationPermission();
    };

    document.addEventListener('click', activateAlerts, { once: true });
    document.addEventListener('keydown', activateAlerts, { once: true });

    if ('Notification' in window && Notification.permission === 'granted') {
      activateAlerts();
    }

    return () => {
      document.removeEventListener('click', activateAlerts);
      document.removeEventListener('keydown', activateAlerts);
    };
  }, []);

  useEffect(() => {
    void getOrders('PENDIENTE_CONFIRMACION', true, 'MENU_PUBLICO')
      .then((orders) => {
        orders.forEach((order) => knownIds.current.add(order.id));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const connect = async () => {
      try {
        setLive(true);
        await subscribeEntrantesStream((event) => {
          if (event.type === 'ping') return;

          if (event.type === 'new_order' && event.order) {
            if (event.order.source && event.order.source !== 'MENU_PUBLICO') {
              return;
            }

            const isNew = !knownIds.current.has(event.order.id);
            knownIds.current.add(event.order.id);

            if (isNew) {
              playNewOrderAlert();
              showNewOrderNotification(
                event.order.orderNumber,
                event.order.customerName ?? undefined,
              );

              if (event.order.type === 'DELIVERY') {
                setDeliveryNewCount((count) => count + 1);
              } else {
                setNewOrderCount((count) => count + 1);
              }
            }
          }
        }, controller.signal);
      } catch {
        if (active) {
          setLive(false);
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      active = false;
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <EntrantesAlertsContext.Provider
      value={{
        live,
        newOrderCount,
        deliveryNewCount,
        resetRecojoNewCount,
        resetDeliveryNewCount,
        resetNewOrderCount,
      }}
    >
      {children}
    </EntrantesAlertsContext.Provider>
  );
}
