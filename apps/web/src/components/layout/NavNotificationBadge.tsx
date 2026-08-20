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

export function getNavAlertClass(
  href: string,
  recojoCount: number,
  deliveryCount: number,
): string {
  if (href === '/entrantes' && recojoCount > 0) {
    return 'nav-item-alert--recojo';
  }
  if (href === '/delivery' && deliveryCount > 0) {
    return 'nav-item-alert--delivery';
  }
  return '';
}

export function NavNotificationBadge({
  count,
  className = '',
  size = 'md',
  pulse = false,
}: {
  count: number;
  className?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);
  const sizeClass =
    size === 'sm'
      ? 'min-w-[16px] h-4 px-1 text-[10px]'
      : 'min-w-[18px] h-[18px] px-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-red-500 font-extrabold leading-none text-white shadow-sm ${sizeClass} ${
        pulse ? 'nav-badge-alert' : ''
      } ${className}`}
      aria-label={`${label} pedido(s) nuevo(s)`}
    >
      {label}
    </span>
  );
}
