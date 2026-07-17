'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import { useRestaurantBranding } from '@/hooks/useRestaurantBranding';

export default function LoginPage() {
  const router = useRouter();
  const branding = useRestaurantBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string | string[] }).message)
          : 'Error al iniciar sesión';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <RestaurantLogo
            name={branding.name}
            logoUrl={branding.logoUrl}
            subtitle="Inicia sesión para continuar"
            size="lg"
          />
        </div>

        <Card padding="lg" className="shadow-md shadow-black/[0.04]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="cajera@restaurante.com"
              autoComplete="email"
            />

            <Input
              id="password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full rounded-xl"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </Card>

        <Card
          padding="sm"
          className="mt-5 bg-background border-dashed text-xs text-text-secondary"
        >
          <p className="font-bold text-foreground mb-2">Credenciales demo</p>
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-foreground">Cajera:</span>{' '}
              cajera@restaurante.com
            </p>
            <p>
              <span className="font-semibold text-foreground">Jefa:</span>{' '}
              jefa@restaurante.com
            </p>
            <p>
              <span className="font-semibold text-foreground">Contraseña:</span>{' '}
              password123
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
