'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavIcon } from './NavIcon';
import {
  cajeraNavItems,
  isNavActive,
  jefaMobileNavItems,
  jefaNavItems,
} from './nav-config';

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const tabs =
    user?.role === 'JEFA' ? jefaMobileNavItems : cajeraNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-40">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const active = isNavActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition ${
                active ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <NavIcon
                icon={tab.icon}
                className={`size-5 ${active ? 'text-primary' : 'text-text-secondary'}`}
              />
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

  return (
    <nav className="hidden sm:flex lg:hidden gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {jefaNavItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:bg-white/[0.06]'
            }`}
          >
            <NavIcon icon={item.icon} className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
