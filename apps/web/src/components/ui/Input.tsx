import { InputHTMLAttributes } from 'react';

export function Input({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 border border-border rounded-xl bg-card text-sm text-foreground placeholder:text-text-secondary/70 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
}
