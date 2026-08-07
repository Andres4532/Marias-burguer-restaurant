'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { FormError } from '@/components/ui/CrudForm';
import { RestaurantLogo } from '@/components/layout/RestaurantLogo';
import {
  getPublicMenu,
  getPublicMenuErrorMessage,
} from '@/lib/public-menu';

const ORDER_OPTIONS = [
  {
    tipo: 'PARA_LLEVAR' as const,
    emoji: '🥡',
    title: 'Para recojo',
    description: 'Pasa a recoger tu pedido en el local.',
  },
  {
    tipo: 'DELIVERY' as const,
    emoji: '🛵',
    title: 'Delivery',
    description: 'Te lo llevamos a la dirección que indiques.',
  },
];

export default function PublicMenuGatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicMenu(slug);
      setRestaurantName(data.restaurant.name);
      setRestaurantLogo(data.restaurant.logoUrl);
    } catch (e) {
      setError(getPublicMenuErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = (tipo: 'PARA_LLEVAR' | 'DELIVERY') => {
    router.push(`/menu/${slug}/pedir?tipo=${tipo}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full text-center" padding="lg">
          <FormError message={error} />
          <p className="text-sm text-text-secondary mt-3">
            El menú no está disponible en este momento.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-lg mx-auto">
          <RestaurantLogo
            name={restaurantName}
            logoUrl={restaurantLogo}
            subtitle="¿Cómo quieres recibir tu pedido?"
            size="lg"
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <p className="text-center text-sm text-text-secondary font-medium">
            Elige una opción para ver el menú y armar tu pedido.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ORDER_OPTIONS.map((option) => (
              <button
                key={option.tipo}
                type="button"
                onClick={() => handleSelect(option.tipo)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-4xl" aria-hidden>
                  {option.emoji}
                </span>
                <div>
                  <p className="text-lg font-extrabold text-foreground group-hover:text-primary transition">
                    {option.title}
                  </p>
                  <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
