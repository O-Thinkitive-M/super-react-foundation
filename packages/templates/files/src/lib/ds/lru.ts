// src/lib/ds/lru.ts — bounded cache (recently-viewed, memoized lookups)
export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private max: number;
  constructor(max: number) {
    this.max = Math.max(1, max); // a 0/negative cap would self-evict on every set
  }
  get(k: K): V | undefined {
    if (!this.map.has(k)) return undefined;
    const v = this.map.get(k) as V;
    this.map.delete(k);
    this.map.set(k, v); // touch -> most-recent (works even when v === undefined)
    return v;
  }
  set(k: K, v: V): void {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as K); // evict oldest
  }
  has(k: K): boolean { return this.map.has(k); }
}
