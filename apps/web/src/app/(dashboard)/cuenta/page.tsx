'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { FormError, FormSuccess } from '@/components/ui/CrudForm';
import { RoleBadge, UserAvatar } from '@/components/ui/UserBadge';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/lib/auth';
import { getErrorMessage } from '@/lib/catalog';

export default function CuentaPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mi cuenta"
        description="Perfil y seguridad de tu acceso"
      />

      <div className="max-w-md space-y-5">
        {user && (
          <Card>
            <div className="flex items-center gap-4">
              <UserAvatar name={user.name} />
              <div className="min-w-0">
                <p className="font-bold text-foreground text-lg">{user.name}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Usuario / correo
                </p>
                <p className="text-sm text-text-secondary truncate">
                  {user.email}
                </p>
                <div className="mt-2">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h3 className="font-bold text-foreground mb-4">Cambiar contraseña</h3>

          <div className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <p className="text-xs text-text-secondary">
              Mínimo 6 caracteres.
            </p>

            {error && <FormError message={error} />}
            {success && <FormSuccess message={success} />}

            <Button
              onClick={handleSubmit}
              disabled={
                saving ||
                !currentPassword ||
                newPassword.length < 6 ||
                !confirmPassword
              }
            >
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
