'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ActiveCheckbox, FormError, FormSuccess } from '@/components/ui/CrudForm';
import {
  getSettings,
  updateSettings,
  getPublicMenuUrl,
  formatMenuSchedule,
} from '@/lib/settings';
import { getErrorMessage } from '@/lib/catalog';
import { uploadLogo } from '@/lib/uploads';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import { ImageUploadField } from '@/components/ui/ImageUploadField';

export default function ConfiguracionPage() {
  const { loading, isJefa } = useRequireJefa();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [publicMenuEnabled, setPublicMenuEnabled] = useState(true);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const data = await getSettings();
      setName(data.name);
      setSlug(data.slug);
      setPhone(data.phone ?? '');
      setLogoUrl(data.logoUrl ?? '');
      setPublicMenuEnabled(data.publicMenuEnabled);
      setOpenTime(data.publicMenuOpenTime ?? '08:00');
      setCloseTime(data.publicMenuCloseTime ?? '22:00');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await updateSettings({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        publicMenuEnabled,
        publicMenuOpenTime: openTime,
        publicMenuCloseTime: closeTime,
      });
      setName(updated.name);
      setSlug(updated.slug);
      setPhone(updated.phone ?? '');
      setLogoUrl(updated.logoUrl ?? '');
      setPublicMenuEnabled(updated.publicMenuEnabled);
      setOpenTime(updated.publicMenuOpenTime ?? '08:00');
      setCloseTime(updated.publicMenuCloseTime ?? '22:00');
      setSuccess('Configuración guardada');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const url = getPublicMenuUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar el enlace');
    }
  };

  if (loading || !isJefa) {
    return (
      <p className="text-text-secondary py-12 text-center font-medium">
        Cargando configuración...
      </p>
    );
  }

  const menuUrl = getPublicMenuUrl(slug);

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Datos del local y menú público"
      />

      <div className="max-w-xl space-y-5">
        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Datos del local
          </h3>
          <div className="space-y-4">
            <Input
              label="Nombre del restaurante"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Logo
          </h3>
          <div className="space-y-4">
            <ImageUploadField
              label="Logo del restaurante"
              value={logoUrl}
              onChange={setLogoUrl}
              onUpload={uploadLogo}
              hint="Opcional. También se usa como icono de la pestaña del navegador."
              preview={
                <div className="p-4 rounded-xl bg-background border border-border">
                  <RestaurantLogo
                    name={name || 'Mi Restaurante'}
                    logoUrl={logoUrl}
                    subtitle="Vista previa del logo"
                    size="lg"
                  />
                </div>
              }
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">
            Menú público
          </h3>
          <div className="space-y-4">
            <Input
              label="Slug del menú público"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
            <p className="text-xs text-text-secondary -mt-2">
              Solo minúsculas, números y guiones. Ej: mi-restaurante
            </p>

            <ActiveCheckbox
              checked={publicMenuEnabled}
              onChange={setPublicMenuEnabled}
              label="Menú público activo"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Apertura menú público"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
              <Input
                label="Cierre menú público"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-text-secondary -mt-2">
              Horario actual: {formatMenuSchedule(openTime, closeTime)} (hora del
              restaurante)
            </p>

            <div className="rounded-xl p-4 bg-background border border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Enlace del menú público
              </p>
              <p className="text-sm text-primary font-bold break-all mb-3">
                {menuUrl}
              </p>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </Button>
            </div>
          </div>
        </Card>

        {(error || success) && (
          <div className="space-y-3">
            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving || loadingSettings}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
