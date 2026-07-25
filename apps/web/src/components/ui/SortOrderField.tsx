'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getMenuPositionRank,
  getSortOrderForEnd,
  getSortOrderForStart,
  parseSortOrderInput,
} from '@/lib/sort-order';

interface SortOrderFieldProps {
  value: string;
  onChange: (value: string) => void;
  peers: Array<{ id: string; sortOrder: number }>;
  editingId?: string;
  /** Ej: "en la categoría Bebidas" o "entre las categorías del menú" */
  scopeHint: string;
}

export function SortOrderField({
  value,
  onChange,
  peers,
  editingId,
  scopeHint,
}: SortOrderFieldProps) {
  const sortOrder = parseSortOrderInput(value);
  const { rank, total } = getMenuPositionRank(sortOrder, peers, editingId);
  const others = peers.filter((p) => p.id !== editingId);

  const setStart = () => {
    onChange(String(getSortOrderForStart(others)));
  };

  const setEnd = () => {
    onChange(String(getSortOrderForEnd(others)));
  };

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
      <div>
        <Input
          label="Posición en el menú"
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <p className="text-xs text-text-secondary mt-2 leading-relaxed">
          Controla qué tan arriba se ve {scopeHint}. El número{' '}
          <strong className="text-foreground">más bajo</strong> va primero (como
          leer una lista de arriba hacia abajo).
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-lg bg-primary/15 border border-primary/30 px-3 py-1.5 text-sm font-bold text-primary">
          Vista previa: #{rank} de {total}
        </span>
        <span className="text-xs text-text-secondary">
          (con el valor {sortOrder} {scopeHint})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={setStart}>
          ↑ Al inicio
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={setEnd}>
          ↓ Al final
        </Button>
      </div>
    </div>
  );
}
