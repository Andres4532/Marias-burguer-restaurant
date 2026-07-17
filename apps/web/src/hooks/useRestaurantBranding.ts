'use client';

import { useEffect, useState } from 'react';
import { getPublicBranding, type RestaurantBranding } from '@/lib/branding';

const FALLBACK: RestaurantBranding = {
  name: 'POS Restaurante',
  logoUrl: null,
};

export function useRestaurantBranding() {
  const [branding, setBranding] = useState<RestaurantBranding>(FALLBACK);

  useEffect(() => {
    getPublicBranding()
      .then(setBranding)
      .catch(() => setBranding(FALLBACK));
  }, []);

  return branding;
}
