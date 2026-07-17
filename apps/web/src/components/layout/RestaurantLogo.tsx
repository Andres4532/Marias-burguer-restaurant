'use client';

import Image from 'next/image';

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
    </svg>
  );
}

export function RestaurantLogo({
  name,
  logoUrl,
  subtitle,
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const boxSize =
    size === 'sm' ? 'size-9' : size === 'lg' ? 'size-14' : 'size-10';
  const titleSize =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
        ? 'text-2xl sm:text-3xl'
        : 'text-lg';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`relative flex ${boxSize} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary`}
      >
        {logoUrl?.trim() ? (
          <Image
            src={logoUrl}
            alt={`Logo ${name}`}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <DefaultIcon
            className={size === 'lg' ? 'size-7' : size === 'sm' ? 'size-4' : 'size-5'}
          />
        )}
      </div>
      <div className="min-w-0">
        <h1
          className={`${titleSize} font-extrabold text-foreground tracking-tight leading-tight truncate`}
        >
          {name}
        </h1>
        {subtitle && (
          <p className="text-xs text-text-secondary truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
