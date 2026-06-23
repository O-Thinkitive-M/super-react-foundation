# Data Structures & Algorithms (Reusable Logic)
> Match the structure to the access pattern and the algorithm to the complexity class; expose both as typed, dependency-free helpers so every feature reuses them rather than re-rolling loops.

## Rule
- Prefer these helpers over re-rolling loops in features: reach for `src/lib/ds` / `src/lib/algo` before writing a manual `for`, `.find`, nested loop, or hand-built `{}` lookup.
- Every helper is pure, typed, and zero-dependency — no install, no `any`, no shared mutable state.
- If a feature needs a structure not covered here, add it to `src/lib/ds` or `src/lib/algo` (typed, pure, tested) instead of inlining it — so the next feature reuses it too.

## Structure by access pattern
Pick the structure from how you read the data, not how you receive it.

| Access pattern | Structure | Helper to use |
|---|---|---|
| Lookup by id | Normalized map `{ byId, allIds }` | `normalize.ts` → `normalize()` |
| Membership test ("is x in set?") | `Set` | `collections.ts` → `toSet()` / `unique()` |
| Lookup by arbitrary key | Keyed `Map` | `collections.ts` → `indexBy()` |
| Bucketing / "all items with key K" | Grouped `Map<K, T[]>` | `collections.ts` → `groupBy()` |
| Frequency / counts | `Map<K, number>` | `collections.ts` → `countBy()` |
| Recency / bounded cache | LRU | `lru.ts` → `LRUCache` |
| Ordered scan / range / "first ≥ x" | Sorted array + binary search | `binarySearch.ts` → `lowerBound()` |
| Multi-key ordering | Composed comparators | `comparator.ts` → `sortBy()` / `byKey()` |
| Hierarchy (nav, org units, threads) | Tree | `tree.ts` → `walkTree()` / `findInTree()` |
| Relationships / reachability | Graph (adjacency fn) | `graph.ts` → `bfs()` |
| Overlap / scheduling | Intervals | `intervals.ts` → `hasOverlap()` |
| High-frequency events (input/scroll/save) | Rate limiting | `rate.ts` → `debounce()` / `throttle()` / `memoize()` |

## Reusable helpers (src/lib/ds)

| File | Exports | When to use |
|---|---|---|
| `collections.ts` | `indexBy(items, key)` → `Map<K,T>` · `groupBy(items, key)` → `Map<K,T[]>` · `countBy(items, key)` → `Map<K,number>` · `unique(items)` → `T[]` · `partition(items, pred)` → `[pass, fail]` · `toSet(items, key)` → `Set<K>` | Replace repeated `.find`, manual bucket objects, dedup loops, and two-pass filters with one typed pass. |
| `lru.ts` | `class LRUCache<K,V>` — `get` (promotes recency), `set` (evicts oldest past `max`), `has`; `max` is floored to ≥1 | Bounded caches: recently-viewed lists, memoized lookups, anything that must not grow unbounded. |
| `normalize.ts` | `normalize(list)` → `{ byId, allIds }` (requires `T extends { id: string }`) | Turn an API list response into entity state for O(1) id lookups and stable ordering. |
| `tree.ts` | `interface TreeNode<T> { value; children }` · `walkTree(roots, visit, depth?)` (depth-aware DFS) · `findInTree(roots, pred)` → `T \| undefined` (cycle-safe via sentinel, distinguishes "found `undefined`" from "not found") | Hierarchies: nav menus, org units, threaded comments — traverse or search without hand-written recursion. |

## Algorithms (src/lib/algo)

| File | Exports | When to use / Big-O |
|---|---|---|
| `binarySearch.ts` | `lowerBound(sorted, target, valueOf)` → first index whose value ≥ target (== `length` if none) | Range queries / insertion points on a **sorted** array. **O(log n)** vs O(n) linear scan. Caller must keep the array sorted by `valueOf`. |
| `comparator.ts` | `byKey(sel, dir?)` → comparator · `sortBy(...cmps)` → first-non-zero-wins comparator | Multi-key sorts without `if`-chains: `rows.slice().sort(sortBy(byKey(r => r.rank), byKey(r => r.date, 'desc')))`. Sort itself is **O(n log n)**; comparator build is O(1). |
| `graph.ts` | `bfs(start, neighbors)` → visited order; `neighbors(n)` returns an `Iterable<N>` | Reachability / shortest-hop traversal (permission chains, referral graphs). **O(V + E)**, cycle-safe (visited `Set`), O(1) dequeue via cursor (no `shift`). |
| `intervals.ts` | `interface Interval { start; end }` · `hasOverlap(intervals)` → `boolean` (sweep after sort) | Detect scheduling conflicts: appointments, room/resource booking. **O(n log n)** (dominated by the sort). |
| `rate.ts` | `debounce(fn, ms)` · `throttle(fn, ms)` · `memoize(fn, keyOf, max?)` (LRU-backed, default cap 100) | Tame high-frequency calls: `debounce` search/autosave, `throttle` scroll/resize, `memoize` pure recomputes. `memoize` is **O(1)** amortized lookup, memory-bounded by the LRU. |

## Normalized entity state
- Shape: `{ byId: Record<string, T>, allIds: string[] }` — `byId` for **O(1) lookup**, `allIds` for **stable order / iteration**.
- Build it once from a list response: `const users = normalize(apiUsers)` (each `T` must have a string `id`).
- Pairs with the client-state store: keep the normalized shape **in the store**, derive UI lists with `allIds.map(id => byId[id])` in selectors.
- Update by id without touching unrelated entities:
  - update: `{ ...state.byId, [id]: { ...state.byId[id], ...patch } }`
  - insert: spread into `byId` and append `id` to `allIds`
  - remove: omit the key from `byId` and `filter` it out of `allIds`
- Why normalize: no duplicated copies of the same entity across lists, no deep-scan to update one record, and references stay shallow-comparable for React.

## Immutability
- **Never mutate inputs.** Every helper here treats its arguments as `readonly` and returns a **new** structure (new `Map`, `Set`, array, or object) — none patch in place.
  - `intervals.hasOverlap` sorts a **copy** (`[...intervals]`), not the caller's array.
  - `LRUCache` is the one intentionally stateful helper — its mutation is fully encapsulated behind `get`/`set`/`has`; callers still treat returned values as read-only.
- Keep callers pure too: build derived data with the helpers, then assign — don't `push`/`splice`/reassign fields on existing objects.
- This is exactly what React state updates require: produce a **new reference** so change detection fires. Spread (`{ ...x }`, `[...xs]`) or the patterns under *Normalized entity state*; never edit state objects directly.
- Pure helpers + new references = predictable renders, safe memoization (`React.memo`, `useMemo`), and trivial undo/diffing.

## Complexity & choosing
Choose the structure by the dominant operation's complexity class, not by convenience.

| Operation | Naive | With helper | Complexity |
|---|---|---|---|
| Find item by id (repeated) | `.find` per lookup | `indexBy` / `normalize` then map access | O(n) → **O(1)** per lookup |
| Membership test | `.includes` | `toSet` then `set.has` | O(n) → **O(1)** per test |
| Group items by key | manual bucket object + init checks | `groupBy` | O(n) (one pass) |
| Frequency counts | manual increment loop | `countBy` | O(n) (one pass) |
| Find first value ≥ target (sorted) | linear scan | `lowerBound` | O(n) → **O(log n)** |
| Multi-key sort | nested `if`/`||` comparator | `sortBy(byKey, …)` | **O(n log n)** |
| Reachability / traversal | hand-rolled queue + visited flags | `bfs` | **O(V + E)**, cycle-safe |
| Overlap detection | O(n²) pairwise compare | `hasOverlap` (sort + sweep) | O(n²) → **O(n log n)** |
| Recompute pure result | recompute every call | `memoize` | O(1) amortized (LRU-bounded) |

Guidance:
- **O(1) reads** (id lookup, membership, counts) → `Map` / `Set` / normalized state. Pay the O(n) build cost once, then read cheaply.
- **Ordered / range reads** → sorted array + `lowerBound`; keep it sorted on insert rather than re-sorting per query.
- **Shape is a hierarchy** → tree; **shape is relationships/cycles** → graph (`bfs` is cycle-safe).
- **Event storms** (typing, scrolling, saving) → `rate.ts` to cap call frequency.
- Rule of thumb: if a feature does the same scan more than once, replace the scan with one of these structures.
