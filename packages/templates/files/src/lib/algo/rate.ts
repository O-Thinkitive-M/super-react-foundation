import { LRUCache } from "../ds/lru";

// src/lib/algo/rate.ts — debounce + throttle (search, scroll, autosave)
export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: A) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
export function throttle<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  let last = 0, t: ReturnType<typeof setTimeout> | undefined, lastArgs: A;
  return (...a: A) => {
    lastArgs = a; const now = performance.now(); const wait = ms - (now - last);
    if (wait <= 0) { last = now; fn(...a); }
    else if (!t) t = setTimeout(() => { last = performance.now(); t = undefined; fn(...lastArgs); }, wait);
  };
}

/** Memoize a pure fn by a string key (bound by LRU to stay memory-safe). */
export function memoize<A extends unknown[], R>(fn: (...a: A) => R, keyOf: (...a: A) => string, max = 100) {
  const cache = new LRUCache<string, R>(max);              // from src/lib/ds/lru.ts
  return (...a: A): R => {
    const k = keyOf(...a); const hit = cache.get(k);
    if (hit !== undefined) return hit;
    const v = fn(...a); cache.set(k, v); return v;
  };
}
