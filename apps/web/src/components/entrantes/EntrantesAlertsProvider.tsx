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
  alertsEnabled: boolean;
  newOrderCount: number;
  enableAlerts: () => Promise<void>;
  resetNewOrderCount: () => void;
}

const EntrantesAlertsContext = createContext<EntrantesAlertsContextValue>({
  live: false,
  alertsEnabled: false,
  newOrderCount: 0,
  enableAlerts: async () => {},
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
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const knownIds = useRef(new Set<string>());
  const alertsEnabledRef = useRef(alertsEnabled);

  useEffect(() => {
    alertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  const enableAlerts = useCallback(async () => {
    unlockAudio();
    const granted = await requestNotificationPermission();
    setAlertsEnabled(granted);
  }, []);

  const resetNewOrderCount = useCallback(() => {
    setNewOrderCount(0);
  }, []);

  useEffect(() => {
    const unlockOnInteraction = () => unlockAudio();
    document.addEventListener('click', unlockOnInteraction, { once: true });
    document.addEventListener('keydown', unlockOnInteraction, { once: true });

    if ('Notification' in window && Notification.permission === 'granted') {
      setAlertsEnabled(true);
    }

    return () => {
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
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
            const isNew = !knownIds.current.has(event.order.id);
            knownIds.current.add(event.order.id);

            if (isNew) {
              playNewOrderAlert();
              if (alertsEnabledRef.current) {
                showNewOrderNotification(
                  event.order.orderNumber,
                  event.order.customerName ?? undefined,
                );
              }
              setNewOrderCount((count) => count + 1);
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
        alertsEnabled,
        newOrderCount,
        enableAlerts,
        resetNewOrderCount,
      }}
    >
      {children}
    </EntrantesAlertsContext.Provider>
  );
}
