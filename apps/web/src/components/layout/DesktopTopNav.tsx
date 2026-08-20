'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEntrantesAlerts } from '@/components/entrantes/EntrantesAlertsProvider';
import { NavIcon } from './NavIcon';
import {
  getNavAlertClass,
  getNavBadgeCount,
  NavNotificationBadge,
} from './NavNotificationBadge';
import { RestaurantLogo } from './RestaurantLogo';
import { cajeraNavItems, isNavActive } from './nav-config';

export function DesktopTopNav() {
  const pathname = usePathname();
  const { newOrderCount, deliveryNewCount } = useEntrantesAlerts();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {cajeraNavItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const badgeCount = getNavBadgeCount(
          item.href,
          newOrderCount,
          deliveryNewCount,
        );
        const alertClass = getNavAlertClass(
          item.href,
          newOrderCount,
          deliveryNewCount,
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
              active
                ? 'text-primary bg-primary/10'
                : 'text-text-secondary hover:text-foreground hover:bg-white/[0.06]'
            } ${!active ? alertClass : ''}`}
          >
            <span className="relative shrink-0">
              <NavIcon icon={item.icon} className="size-4" />
              {badgeCount > 0 && (
                <NavNotificationBadge
                  count={badgeCount}
                  size="sm"
                  pulse
                  className="absolute -top-1.5 -right-2 ring-2 ring-background"
                />
              )}
            </span>
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
