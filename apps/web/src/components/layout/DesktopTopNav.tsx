'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RestaurantLogo } from './RestaurantLogo';
import { cajeraNavItems, isNavActive } from './nav-config';

export function DesktopTopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {cajeraNavItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              active
                ? 'text-primary bg-primary/10'
                : 'text-text-secondary hover:text-foreground hover:bg-white/[0.06]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandLogo({
  subtitle,
  name = 'POS Restaurante',
  logoUrl = null,
}: {
  subtitle: string;
  name?: string;
  logoUrl?: string | null;
}) {
  return <RestaurantLogo name={name} logoUrl={logoUrl} subtitle={subtitle} />;
}
