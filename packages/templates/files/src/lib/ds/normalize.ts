// shape
interface Normalized<T> { byId: Record<string, T>; allIds: string[]; }

// build from an API list response (one pass)
export function normalize<T extends { id: string }>(list: readonly T[]): Normalized<T> {
  const byId: Record<string, T> = {};
  const allIds: string[] = [];
  for (const it of list) { byId[it.id] = it; allIds.push(it.id); }
  return { byId, allIds };
}
