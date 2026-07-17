export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${
        active
          ? 'bg-primary text-white shadow-sm shadow-primary/20'
          : 'bg-card text-text-secondary border border-border hover:bg-white/[0.06] hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
