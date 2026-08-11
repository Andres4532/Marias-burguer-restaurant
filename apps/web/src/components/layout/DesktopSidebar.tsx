'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from './NavIcon';
import { RestaurantLogo } from './RestaurantLogo';
import { isNavActive, jefaOperacionNavItems, jefaAdminNavItems, jefaCatalogoNavItems, type NavItem } from './nav-config';

export function DesktopSidebar({
  name = 'POS Restaurante',
  logoUrl = null,
}: {
  name?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  const operacion = jefaOperacionNavItems;
  const admin = jefaAdminNavItems;
  const catalogo = jefaCatalogoNavItems;

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-card p-5">
      <div className="mb-8">
        <RestaurantLogo name={name} logoUrl={logoUrl} subtitle="Panel jefa" />
      </div>

      <nav className="flex flex-col gap-6 text-sm font-bold flex-1 overflow-y-auto">
        <NavGroup title="Operación" items={operacion} pathname={pathname} />
        <NavGroup title="Administración" items={admin} pathname={pathname} />
        <NavGroup title="Catálogo" items={catalogo} pathname={pathname} />
      </nav>

      <Link
        href="/configuracion"
        className="mt-6 rounded-xl bg-primary/10 p-4 hover:bg-primary/15 transition"
      >
        <p className="text-sm font-bold text-primary">Menú público</p>
        <p className="text-xs text-text-secondary mt-1">
          Configura el enlace y logo en Configuración
        </p>
      </Link>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="px-4 mb-2 text-[11px] font-bold uppercase tracking-wider text-text-secondary/80">
        {title}
      </p>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                active
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'text-text-secondary hover:bg-white/[0.06] hover:text-foreground'
              }`}
            >
              <NavIcon icon={item.icon} className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
