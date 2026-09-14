function compareWithNullsLast<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  compare: (a: T, b: T) => number
): number {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return compare(a, b);
}

export function compareText(a: string | null | undefined, b: string | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => x.localeCompare(y));
}

export function compareNumber(a: number | null | undefined, b: number | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => x - y);
}

export function compareDate(a: string | null | undefined, b: string | null | undefined): number {
  return compareWithNullsLast(a, b, (x, y) => new Date(x).getTime() - new Date(y).getTime());
}
