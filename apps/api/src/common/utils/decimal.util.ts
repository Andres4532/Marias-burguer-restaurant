import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(
  value: Decimal | number | string | { toString(): string } | null | undefined,
): number {
  if (value == null) return 0;
  return Number(value);
}
