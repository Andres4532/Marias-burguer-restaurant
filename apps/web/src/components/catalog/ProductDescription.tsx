export function ProductDescription({
  description,
  className = '',
}: {
  description: string | null | undefined;
  className?: string;
}) {
  const text = description?.trim();
  if (!text) return null;

  return (
    <p
      className={`whitespace-pre-wrap break-words leading-relaxed text-text-secondary ${className}`}
    >
      {text}
    </p>
  );
}
