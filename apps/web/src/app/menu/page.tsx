import { redirect } from 'next/navigation';
import { getApiUrl } from '@/lib/api-url';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

async function getMenuSlug(): Promise<string | null> {
  try {
    const res = await fetch(`${getApiUrl()}/public/menu/link`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export default async function MenuIndexPage() {
  const slug = await getMenuSlug();

  if (slug) {
    redirect(`/menu/${slug}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="text-center max-w-sm w-full" padding="lg">
        <h1 className="text-xl font-extrabold text-foreground mb-2 tracking-tight">
          Menú no disponible
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          El menú público está desactivado o no está configurado. La jefa puede
          activarlo en Configuración.
        </p>
      </Card>
    </div>
  );
}
