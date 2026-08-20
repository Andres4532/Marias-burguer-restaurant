'use client';

import { useLayoutEffect, useRef, useState } from 'react';

interface ProductDescriptionProps {
  description: string;
  className?: string;
  collapsedLines?: 2 | 3;
}

function ChevronIcon({ up }: { up?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${
        up ? 'rotate-180' : ''
      }`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ProductDescription({
  description,
  className = 'text-xs text-text-secondary',
  collapsedLines = 2,
}: ProductDescriptionProps) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  const lineClampClass = collapsedLines === 3 ? 'line-clamp-3' : 'line-clamp-2';

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const syncHeight = () => {
      const nextHeight = el.scrollHeight;
      setMaxHeight(nextHeight);

      if (expanded) {
        setOverflows(true);
        return;
      }

      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [description, expanded, lineClampClass]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const el = contentRef.current;
    if (!el) return;

    setMaxHeight(el.scrollHeight);
    setExpanded((value) => !value);
  };

  const showToggle = overflows;

  return (
    <div className="relative">
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: maxHeight != null ? `${maxHeight}px` : undefined }}
      >
        <p
          ref={contentRef}
          className={`${className} ${expanded ? '' : lineClampClass}`}
        >
          {description}
        </p>
      </div>

      {showToggle && !expanded && (
        <div
          className="pointer-events-none absolute bottom-6 left-0 right-0 h-5 bg-gradient-to-t from-card via-card/80 to-transparent"
          aria-hidden
        />
      )}

      {showToggle && (
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-bold text-primary transition hover:bg-primary/10 active:scale-[0.98]"
        >
          <ChevronIcon up={expanded} />
          {expanded ? 'Ver menos' : 'Ver descripción'}
        </button>
      )}
    </div>
  );
}
