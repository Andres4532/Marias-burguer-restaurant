import { ReactNode } from 'react';
import { Card } from './Card';

export function CrudTable({
  loading,
  empty,
  loadingMessage,
  emptyMessage,
  children,
}: {
  loading: boolean;
  empty: boolean;
  loadingMessage: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      {loading ? (
        <p className="p-6 text-text-secondary font-medium">{loadingMessage}</p>
      ) : empty ? (
        <p className="p-8 text-center text-text-secondary font-medium">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </Card>
  );
}

export function CrudThead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-background border-b border-border">
      <tr className="text-left text-xs font-bold uppercase tracking-wider text-text-secondary">
        {children}
      </tr>
    </thead>
  );
}

export function CrudTh({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-3 font-bold ${className}`}>{children}</th>;
}

export function CrudTr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-primary/[0.02] transition">
      {children}
    </tr>
  );
}

export function CrudTd({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-4 align-middle ${className}`}>{children}</td>;
}
