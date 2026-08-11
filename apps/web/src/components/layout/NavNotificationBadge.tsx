'use client';

export function getNavBadgeCount(
  href: string,
  recojoCount: number,
  deliveryCount: number,
): number {
  if (href === '/delivery') return deliveryCount;
  if (href === '/entrantes') return recojoCount;
  return 0;
}

export function NavNotificationBadge({
  count,
  className = '',
  size = 'md',
}: {
  count: number;
  className?: string;
  size?: 'sm' | 'md';
}) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);
  const sizeClass =
    size === 'sm'
      ? 'min-w-[16px] h-4 px-1 text-[10px]'
      : 'min-w-[18px] h-[18px] px-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-red-500 font-extrabold leading-none text-white shadow-sm ${sizeClass} ${className}`}
      aria-label={`${label} pedido(s) nuevo(s)`}
    >
      {label}
    </span>
  );
}
