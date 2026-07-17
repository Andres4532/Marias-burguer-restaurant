'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRequireJefa } from '@/hooks/useRequireJefa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FormError } from '@/components/ui/CrudForm';
import { RoleBadge, UserAvatar } from '@/components/ui/UserBadge';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  type AppUser,
} from '@/lib/users';
import { getErrorMessage } from '@/lib/catalog';
import type { UserRole } from '@/lib/auth';

export default function UsuariosPage() {
  const { loading, isJefa, user: currentUser } = useRequireJefa();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'CAJERA' as UserRole,
  });

  const load = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setUsers(await getUsers());
      setError('');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isJefa) load();
  }, [isJefa, load]);

  const handleCreate = async () => {
    setError('');
    try {
      await createUser({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        role: form.role,
      });
      setCreateOpen(false);
      setForm({ email: '', password: '', name: '', role: 'CAJERA' });
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || newPassword.length < 6) return;
    try {
      await resetUserPassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword('');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (loading || !isJefa) {
    return (
      <p className="text-text-secondary py-12 text-center font-medium">
        Cargando...
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestión de cajeras y jefas"
        action={
          <Button onClick={() => setCreateOpen(true)}>+ Nuevo usuario</Button>
        }
      />

      {error && (
        <div className="mb-4">
          <FormError message={error} />
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        {loadingUsers ? (
          <p className="p-6 text-text-secondary font-medium">
            Cargando usuarios...
          </p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-text-secondary font-medium">
            No hay usuarios registrados.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-5 py-4 hover:bg-primary/[0.02] transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <UserAvatar name={user.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground">{user.name}</p>
                      <RoleBadge role={user.role} />
                      {!user.isActive && <Badge active={false} />}
                      {user.id === currentUser?.id && (
                        <span className="text-xs font-bold text-primary">
                          (Tú)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setResetUser(user);
                      setNewPassword('');
                    }}
                  >
                    Cambiar contraseña
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button
                      variant={user.isActive ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo usuario"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Correo"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Contraseña inicial"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Rol"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole })
            }
          >
            <option value="CAJERA">Cajera</option>
            <option value="JEFA">Jefa</option>
          </Select>
          <Button
            onClick={handleCreate}
            disabled={
              !form.name.trim() ||
              !form.email.trim() ||
              form.password.length < 6
            }
            className="w-full"
          >
            Crear usuario
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`Nueva contraseña — ${resetUser?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Contraseña nueva"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-text-secondary">
            Mínimo 6 caracteres.
          </p>
          <Button
            onClick={handleResetPassword}
            disabled={newPassword.length < 6}
            className="w-full"
          >
            Guardar contraseña
          </Button>
        </div>
      </Modal>
    </div>
  );
}
