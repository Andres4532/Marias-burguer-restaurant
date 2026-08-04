import { formatPrice } from '@/lib/catalog';

interface ProductPriceProps {
  price: number;
  effectivePrice?: number;
  hasPromotion?: boolean;
  promoLabel?: string | null;
  size?: 'sm' | 'md';
  showBadge?: boolean;
  className?: string;
}

export function ProductPrice({
  price,
  effectivePrice,
  hasPromotion,
  promoLabel,
  size = 'sm',
  showBadge = false,
  className = '',
}: ProductPriceProps) {
  const onPromo =
    hasPromotion && effectivePrice != null && effectivePrice < price;
  const mainSize = size === 'md' ? 'text-base' : 'text-sm';

  if (!onPromo) {
    return (
      <span className={`text-primary font-extrabold ${mainSize} ${className}`}>
        {formatPrice(price)}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <span className={`text-primary font-extrabold ${mainSize}`}>
        {formatPrice(effectivePrice!)}
      </span>
      <span className="text-xs text-text-secondary line-through">
        {formatPrice(price)}
      </span>
      {showBadge && promoLabel && (
        <span className="text-[10px] font-bold text-amber-200 bg-amber-950/60 border border-amber-800/50 px-2 py-0.5 rounded-full">
          {promoLabel}
        </span>
      )}
    </div>
  );
}
