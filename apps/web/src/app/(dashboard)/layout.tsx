'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { DesktopTopNav, BrandLogo } from '@/components/layout/DesktopTopNav';
import { MobileBottomNav, JefaTabletNav } from '@/components/layout/MobileBottomNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { EntrantesAlertsProvider } from '@/components/entrantes/EntrantesAlertsProvider';
import { EntrantesAlertsBar } from '@/components/entrantes/EntrantesAlertsBar';
import { useRestaurantBranding } from '@/hooks/useRestaurantBranding';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const isJefa = user?.role === 'JEFA';
  const branding = useRestaurantBranding();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-text-secondary font-medium">Cargando...</p>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = isJefa ? 'Jefa' : 'Cajera';

  if (isJefa) {
    return (
      <EntrantesAlertsProvider>
        <div className="min-h-screen flex bg-background">
          <DesktopSidebar name={branding.name} logoUrl={branding.logoUrl} />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur lg:hidden">
              <div className="px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <BrandLogo
                    subtitle="Panel jefa"
                    name={branding.name}
                    logoUrl={branding.logoUrl}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href="/cuenta"
                      className="text-sm font-bold text-text-secondary hover:text-foreground px-3 py-2 rounded-xl hover:bg-white/[0.06] transition"
                    >
                      Cuenta
                    </Link>
                    <button
                      onClick={logout}
                      className="text-sm font-bold text-text-secondary hover:text-foreground px-3 py-2 rounded-xl hover:bg-white/[0.06] transition"
                    >
                      Salir
                    </button>
                  </div>
                </div>
                <JefaTabletNav />
              </div>
            </header>

            <div className="hidden lg:block">
              <AppHeader
                userName={user.name}
                roleLabel={roleLabel}
                onLogout={logout}
              />
            </div>

            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
              <EntrantesAlertsBar />
              {children}
            </main>

            <MobileBottomNav />
          </div>
        </div>
      </EntrantesAlertsProvider>
    );
  }

  return (
    <EntrantesAlertsProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              <BrandLogo
                subtitle="Panel de caja"
                name={branding.name}
                logoUrl={branding.logoUrl}
              />
              <DesktopTopNav />
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-sm text-text-secondary font-medium">
                  {user.name}
                </span>
                <Link
                  href="/cuenta"
                  className="md:hidden text-sm font-bold text-text-secondary hover:text-foreground px-2 py-2 rounded-xl"
                >
                  Cuenta
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl bg-card border border-border px-3 md:px-4 py-2 text-sm font-bold text-foreground hover:bg-white/[0.06] transition"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <EntrantesAlertsBar />
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </EntrantesAlertsProvider>
  );
}
