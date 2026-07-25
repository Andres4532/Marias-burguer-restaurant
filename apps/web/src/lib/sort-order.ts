export function getMenuPositionRank(
  sortOrder: number,
  peers: Array<{ id: string; sortOrder: number }>,
  editingId?: string,
): { rank: number; total: number } {
  const others = peers.filter((p) => p.id !== editingId);
  const draftId = editingId ?? '__draft__';
  const combined = [
    ...others.map((p) => ({ id: p.id, sortOrder: p.sortOrder })),
    { id: draftId, sortOrder },
  ].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );

  const rank = combined.findIndex((p) => p.id === draftId) + 1;
  return { rank, total: combined.length };
}

export function getSortOrderForEnd(
  peers: Array<{ sortOrder: number }>,
): number {
  if (peers.length === 0) return 0;
  return Math.max(...peers.map((p) => p.sortOrder)) + 1;
}

export function getSortOrderForStart(
  peers: Array<{ sortOrder: number }>,
): number {
  if (peers.length === 0) return 0;
  const min = Math.min(...peers.map((p) => p.sortOrder));
  return min > 0 ? min - 1 : min - 1;
}

export function parseSortOrderInput(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function sortByMenuOrder<T extends { id: string; sortOrder: number }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
}

/** Intercambia posición con el producto/categoría anterior o siguiente. */
export function swapMenuPosition(
  items: Array<{ id: string; sortOrder: number }>,
  id: string,
  direction: 'up' | 'down',
): Array<{ id: string; sortOrder: number }> | null {
  const sorted = sortByMenuOrder(items);
  const index = sorted.findIndex((p) => p.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= sorted.length) return null;

  return [
    { id: sorted[index].id, sortOrder: sorted[target].sortOrder },
    { id: sorted[target].id, sortOrder: sorted[index].sortOrder },
  ];
}
