import { Button } from './Button';

export function CrudActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="secondary" size="sm" onClick={onEdit}>
        Editar
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Eliminar
      </Button>
    </div>
  );
}

export function ActiveCheckbox({
  checked,
  onChange,
  label = 'Activo',
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs font-normal text-text-secondary leading-snug">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-300 bg-red-950/40 border border-red-800/50 px-3 py-2 rounded-xl font-medium">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <p className="text-sm text-green-300 bg-green-950/40 border border-green-800/50 px-3 py-2 rounded-xl font-medium">
      {message}
    </p>
  );
}

export function FormActions({
  saving,
  onCancel,
  submitLabel = 'Guardar',
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-4">
      <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" disabled={saving} className="min-w-[7rem]">
        {saving ? 'Guardando...' : submitLabel}
      </Button>
    </div>
  );
}
