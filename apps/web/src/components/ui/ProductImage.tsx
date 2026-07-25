'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { normalizeMediaUrl } from '@/lib/media-url';

function PlaceholderIcon({ className }: { className?: string }) {
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

export function ProductImage({
  src,
  alt,
  className = '',
  aspect = 'video',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  /** video 16:9, square 1:1, menu 3:4 (tarjetas del catálogo) */
  aspect?: 'square' | 'video' | 'menu';
}) {
  const resolved = normalizeMediaUrl(src);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [resolved]);

  const aspectClass =
    aspect === 'square'
      ? 'aspect-square'
      : aspect === 'menu'
        ? 'aspect-[3/4]'
        : 'aspect-video';

  const showPlaceholder = !resolved || loadFailed;

  if (showPlaceholder) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-primary/10 text-primary ${aspectClass} ${className}`}
      >
        <PlaceholderIcon className="size-8 opacity-70" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-background ${aspectClass} ${className}`}
    >
      <Image
        src={resolved}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, 200px"
        unoptimized
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}
