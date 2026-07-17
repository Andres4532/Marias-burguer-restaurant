'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface AppHeaderProps {
  userName: string;
  roleLabel: string;
  center?: React.ReactNode;
  onLogout: () => void;
}

export function AppHeader({
  userName,
  roleLabel,
  center,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-foreground truncate">
            {userName}
          </p>
          <p className="text-xs text-text-secondary">{roleLabel}</p>
        </div>

        {center && <div className="hidden md:flex flex-1 justify-center">{center}</div>}

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/cuenta"
            className="hidden sm:inline text-sm font-semibold text-text-secondary hover:text-foreground px-3 py-2 rounded-xl hover:bg-white/[0.06] transition"
          >
            Mi cuenta
          </Link>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
