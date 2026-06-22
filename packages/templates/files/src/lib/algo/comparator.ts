// src/lib/algo/comparator.ts — compose multi-key sorts, no if-chains
type Cmp<T> = (a: T, b: T) => number;
export const byKey = <T>(sel: (t: T) => number | string, dir: 'asc' | 'desc' = 'asc'): Cmp<T> =>
  (a, b) => { const x = sel(a), y = sel(b); const c = x < y ? -1 : x > y ? 1 : 0; return dir === 'asc' ? c : -c; };
/** Apply comparators in priority order; first non-zero wins. */
export const sortBy = <T>(...cmps: Cmp<T>[]): Cmp<T> =>
  (a, b) => { for (const c of cmps) { const r = c(a, b); if (r) return r; } return 0; };
// usage: rows.slice().sort(sortBy(byKey(r => r.statusRank), byKey(r => r.date, 'desc')))
