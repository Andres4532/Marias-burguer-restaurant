'use client';

import Image from 'next/image';

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
  aspect?: 'square' | 'video';
}) {
  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video';

  if (src?.trim()) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-background ${aspectClass} ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 200px"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-primary/10 text-primary ${aspectClass} ${className}`}
    >
      <PlaceholderIcon className="size-8 opacity-70" />
    </div>
  );
}
