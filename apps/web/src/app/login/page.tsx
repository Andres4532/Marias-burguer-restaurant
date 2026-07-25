'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { parseApiError } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import { useRestaurantBranding } from '@/hooks/useRestaurantBranding';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { name, logoUrl, apiConnected } = useRestaurantBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <RestaurantLogo
            name={name}
            logoUrl={logoUrl}
            subtitle="Inicia sesión para continuar"
            size="lg"
          />
        </div>

        {apiConnected === false && (
          <div className="mb-4 rounded-xl border border-amber-800/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            No se pudo conectar con el servidor. La web en Vercel necesita una API
            pública: configura{' '}
            <span className="font-mono text-xs">NEXT_PUBLIC_API_URL</span> (y
            redeploy) o usa el sistema en la laptop con{' '}
            <span className="font-mono text-xs">localhost</span>.
          </div>
        )}

        <Card padding="lg" className="shadow-md shadow-black/[0.04]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
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
      </div>
    </div>
  );
}
