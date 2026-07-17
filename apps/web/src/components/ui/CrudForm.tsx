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
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border text-primary focus:ring-primary/30"
      />
      {label}
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
    <div className="flex gap-2 pt-2">
      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando...' : submitLabel}
      </Button>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
