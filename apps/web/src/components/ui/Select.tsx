import { SelectHTMLAttributes } from 'react';

export function Select({
  label,
  children,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm bg-card text-foreground ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
