'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEntrantesAlerts } from '@/components/entrantes/EntrantesAlertsProvider';
import { NavIcon } from './NavIcon';
import {
  getNavBadgeCount,
  NavNotificationBadge,
} from './NavNotificationBadge';
import {
  cajeraNavItems,
  isNavActive,
  jefaMobileNavItems,
  jefaNavItems,
} from './nav-config';

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { newOrderCount, deliveryNewCount } = useEntrantesAlerts();
  const tabs =
    user?.role === 'JEFA' ? jefaMobileNavItems : cajeraNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-40">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const active = isNavActive(pathname, tab.href);
          const badgeCount = getNavBadgeCount(
            tab.href,
            newOrderCount,
            deliveryNewCount,
          );
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <span className="relative">
                <NavIcon
                  icon={tab.icon}
                  className={`size-5 ${active ? 'text-primary' : 'text-text-secondary'}`}
                />
                {badgeCount > 0 && (
                  <NavNotificationBadge
                    count={badgeCount}
                    size="sm"
                    className="absolute -top-1.5 -right-2.5 ring-2 ring-card"
                  />
                )}
              </span>
              <span
                className={`text-[10px] font-bold ${active ? 'text-primary' : 'text-text-secondary'}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Nav horizontal para jefa en tablet (sin sidebar lateral aún) */
export function JefaTabletNav() {
  const pathname = usePathname();
  const { newOrderCount, deliveryNewCount } = useEntrantesAlerts();

  return (
    <nav className="hidden sm:flex lg:hidden gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {jefaNavItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        const badgeCount = getNavBadgeCount(
          item.href,
          newOrderCount,
          deliveryNewCount,
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-white/[0.06]'
            }`}
          >
            <span className="relative">
              <NavIcon icon={item.icon} className="size-4 shrink-0" />
              {badgeCount > 0 && (
                <NavNotificationBadge
                  count={badgeCount}
                  size="sm"
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
