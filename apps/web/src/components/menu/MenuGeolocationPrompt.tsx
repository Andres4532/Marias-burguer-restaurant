'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  getGeolocationPermissionState,
  requestGeolocationPermission,
  type GeolocationPermissionState,
} from '@/lib/geocoding';

export function MenuGeolocationPrompt() {
  const [status, setStatus] = useState<GeolocationPermissionState>('prompt');
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const refreshStatus = useCallback(async (requestIfNeeded = true) => {
    setChecking(true);
    try {
      const permission = await getGeolocationPermissionState();
      if (permission === 'granted' || permission === 'unsupported') {
        setStatus(permission);
        return;
      }

      if (requestIfNeeded) {
        setRequesting(true);
        const result = await requestGeolocationPermission();
        setStatus(result);
        return;
      }

      setStatus(permission);
    } finally {
      setChecking(false);
      setRequesting(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus(true);
  }, [refreshStatus]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshStatus(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refreshStatus]);

  useEffect(() => {
    if (!navigator.permissions?.query) return;

    let active = true;
    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!active || !permissionStatus) return;
      setStatus(permissionStatus.state as GeolocationPermissionState);
    };

    void navigator.permissions
      .query({ name: 'geolocation' })
      .then((result) => {
        if (!active) return;
        permissionStatus = result;
        setStatus(result.state as GeolocationPermissionState);
        result.addEventListener('change', handleChange);
      })
      .catch(() => {});

    return () => {
      active = false;
      permissionStatus?.removeEventListener('change', handleChange);
    };
  }, []);

  if (checking || status === 'granted' || status === 'unsupported') {
    return null;
  }

  const denied = status === 'denied';

  return (
    <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-950/95 px-4 py-3 shadow-md">
      <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-50">
            {denied ? 'Ubicación bloqueada' : 'Activa tu ubicación'}
          </p>
          <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
            {denied
              ? 'Para delivery necesitamos tu ubicación. Actívala en la configuración del navegador y vuelve a intentar.'
              : 'Permite el acceso a tu ubicación para marcar la entrega más rápido.'}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 bg-amber-50 text-amber-950 hover:bg-white border-0"
          disabled={requesting}
          onClick={() => void refreshStatus(true)}
        >
          {requesting ? 'Solicitando…' : denied ? 'Reintentar' : 'Permitir ubicación'}
        </Button>
      </div>
    </div>
  );
}
