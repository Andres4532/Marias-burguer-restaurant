'use client';

import { useEffect, useState } from 'react';
import { getPublicBranding, type RestaurantBranding } from '@/lib/branding';

const FALLBACK: RestaurantBranding = {
  name: 'POS Restaurante',
  logoUrl: null,
};

export function useRestaurantBranding() {
  const [branding, setBranding] = useState<RestaurantBranding>(FALLBACK);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    getPublicBranding()
      .then((data) => {
        setBranding(data);
        setApiConnected(true);
      })
      .catch(() => {
        setBranding(FALLBACK);
        setApiConnected(false);
      });
  }, []);

  return {
    name: branding.name,
    logoUrl: branding.logoUrl,
    apiConnected,
  };
}
