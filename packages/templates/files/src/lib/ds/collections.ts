// src/lib/ds/collections.ts  — pure, typed, reusable everywhere

/** Index a list by a key → O(1) lookup map (replaces repeated .find). */
export function indexBy<T, K extends PropertyKey>(items: readonly T[], key: (t: T) => K): Map<K, T> {
  const m = new Map<K, T>();
  for (const it of items) m.set(key(it), it);
  return m;
}

/** Group a list into buckets by key (one pass, no manual bucket init). */
export function groupBy<T, K extends PropertyKey>(items: readonly T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of items) {
    const k = key(it);
    const bucket = m.get(k);
    if (bucket) bucket.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Frequency count → Map<key, count>. */
export function countBy<T, K extends PropertyKey>(items: readonly T[], key: (t: T) => K): Map<K, number> {
  const m = new Map<K, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

/** Ordered de-dup (insertion order preserved). */
export const unique = <T>(items: readonly T[]): T[] => [...new Set(items)];

/** Split into [pass, fail] in one pass. */
export function partition<T>(items: readonly T[], pred: (t: T) => boolean): [T[], T[]] {
  const pass: T[] = [], fail: T[] = [];
  for (const it of items) (pred(it) ? pass : fail).push(it);
  return [pass, fail];
}

/** Build a Set keyed from a list — O(1) membership tests. */
export const toSet = <T, K>(items: readonly T[], key: (t: T) => K): Set<K> =>
  new Set(items.map(key));
