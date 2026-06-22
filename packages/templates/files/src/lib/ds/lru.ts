// src/lib/ds/lru.ts — bounded cache (recently-viewed, memoized lookups)
export class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private max: number) {}
  get(k: K): V | undefined {
    const v = this.map.get(k);
    if (v !== undefined) { this.map.delete(k); this.map.set(k, v); } // touch → most-recent
    return v;
  }
  set(k: K, v: V): void {
    if (this.map.has(k)) this.map.delete(k);
    this.map.set(k, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as K); // evict oldest
  }
  has(k: K): boolean { return this.map.has(k); }
}
