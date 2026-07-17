export function Badge({
  active,
  label,
}: {
  active: boolean;
  label?: { on: string; off: string };
}) {
  const text = active ? (label?.on ?? 'Activo') : (label?.off ?? 'Inactivo');
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
        active
          ? 'bg-green-950/40 text-green-300 border border-green-800/50'
          : 'bg-background text-text-secondary border border-border'
      }`}
    >
      {text}
    </span>
  );
}
