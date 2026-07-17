import type { UserRole } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/users';

export function RoleBadge({ role }: { role: UserRole }) {
  const isJefa = role === 'JEFA';
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${
        isJefa
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-blue-950/40 text-blue-300 border-blue-800/50'
      }`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

export function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-extrabold text-sm">
      {initial}
    </div>
  );
}
