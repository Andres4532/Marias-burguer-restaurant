'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getGeolocationPermissionState,
  requestGeolocationPermission,
  type GeolocationPermissionState,
} from '@/lib/geocoding';

export function MenuGeolocationPrompt() {
  const [status, setStatus] = useState<GeolocationPermissionState>('prompt');
  const [initializing, setInitializing] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const applyStatus = useCallback(async (requestIfNeeded: boolean) => {
    const permission = await getGeolocationPermissionState();
    if (permission === 'granted' || permission === 'unsupported') {
      setStatus(permission);
      return permission;
    }

    if (requestIfNeeded && permission === 'prompt') {
      const result = await requestGeolocationPermission();
      setStatus(result);
      return result;
    }

    setStatus(permission);
    return permission;
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        if (!active) return;
        await applyStatus(true);
      } finally {
        if (active) setInitializing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applyStatus]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      void applyStatus(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [applyStatus]);

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

  const handlePrimaryAction = async () => {
    setRequesting(true);
    try {
      const current = await getGeolocationPermissionState();

      if (current === 'granted') {
        setStatus('granted');
        setHelpOpen(false);
        return;
      }

      if (current === 'denied') {
        setHelpOpen(true);
        setStatus('denied');
        return;
      }

      const result = await requestGeolocationPermission();
      setStatus(result);
      if (result === 'denied') {
        setHelpOpen(true);
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleRecheckAfterSettings = async () => {
    setRequesting(true);
    try {
      const current = await getGeolocationPermissionState();
      if (current === 'granted') {
        setStatus('granted');
        setHelpOpen(false);
        return;
      }

      if (current === 'prompt') {
        const result = await requestGeolocationPermission();
        setStatus(result);
        if (result === 'granted') {
          setHelpOpen(false);
        }
        return;
      }

      setStatus('denied');
    } finally {
      setRequesting(false);
    }
  };

  if (initializing || status === 'granted' || status === 'unsupported') {
    return null;
  }

  const denied = status === 'denied';

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-amber-500/40 bg-amber-950/95 px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-50">
              {denied ? 'Ubicación bloqueada' : 'Activa tu ubicación'}
            </p>
            <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
              {denied
                ? 'Chrome ya no puede volver a preguntar. Debes activarla manualmente en la configuración del sitio.'
                : 'Permite el acceso a tu ubicación para marcar la entrega más rápido.'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 bg-amber-50 text-amber-950 hover:bg-white border-0"
            disabled={requesting}
            onClick={() => void handlePrimaryAction()}
          >
            {requesting
              ? 'Comprobando…'
              : denied
                ? 'Cómo activarla'
                : 'Permitir ubicación'}
          </Button>
        </div>
      </div>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Activar ubicación en Chrome"
      >
        <div className="space-y-4 text-sm text-foreground">
          <p className="text-text-secondary leading-relaxed">
            Si antes elegiste <strong>Bloquear</strong>, Google Chrome no vuelve
            a mostrar el popup. Hay que permitirlo manualmente:
          </p>

          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Toca el ícono de <strong>candado</strong> o{' '}
              <strong>ⓘ</strong> junto a la barra de dirección (arriba).
            </li>
            <li>
              Entra a <strong>Permisos</strong> o{' '}
              <strong>Configuración del sitio</strong>.
            </li>
            <li>
              Toca <strong>Ubicación</strong> y elige{' '}
              <strong>Permitir</strong>.
            </li>
            <li>Vuelve al menú y toca <strong>Ya lo activé</strong>.</li>
          </ol>

          <p className="text-xs text-text-secondary leading-relaxed">
            Si sigue bloqueado, revisa también: Ajustes del teléfono →
            Ubicación → activada para Chrome.
          </p>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="sm:flex-1"
              onClick={() => setHelpOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              disabled={requesting}
              onClick={() => void handleRecheckAfterSettings()}
            >
              {requesting ? 'Comprobando…' : 'Ya lo activé'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
