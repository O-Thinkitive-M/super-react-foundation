import { test } from "node:test";
import assert from "node:assert/strict";

const ds = (f: string): string => new URL(`../files/src/lib/ds/${f}`, import.meta.url).href;
const algo = (f: string): string => new URL(`../files/src/lib/algo/${f}`, import.meta.url).href;

test("countBy invokes the key selector once per item", async () => {
  const { countBy } = await import(ds("collections.ts"));
  let calls = 0;
  const m = countBy(["a", "bb", "cc"], (s: string) => { calls++; return s.length; });
  assert.equal(calls, 3);
  assert.equal(m.get(2), 2);
});

test("LRUCache clamps max>=1 so it can store an entry", async () => {
  const { LRUCache } = await import(ds("lru.ts"));
  const c = new LRUCache(0);
  c.set("k", "v");
  assert.equal(c.get("k"), "v");
});

test("LRUCache.get promotes an entry whose value is undefined", async () => {
  const { LRUCache } = await import(ds("lru.ts"));
  const c = new LRUCache(2);
  c.set("a", undefined);
  c.set("b", 2);
  c.get("a");      // touch a -> most-recent; b is now oldest
  c.set("c", 3);   // evicts oldest (b)
  assert.equal(c.has("a"), true);
  assert.equal(c.has("b"), false);
});

test("memoize caches a function that returns undefined (one call per key)", async () => {
  const { memoize } = await import(algo("rate.ts"));
  let calls = 0;
  const f = memoize((x: string) => { calls++; return x === "none" ? undefined : x; }, (x: string) => x);
  f("none"); f("none");
  assert.equal(calls, 1);
});

test("bfs returns breadth-first order and is cycle-safe", async () => {
  const { bfs } = await import(algo("graph.ts"));
  const adj: Record<string, string[]> = { a: ["b", "c"], b: ["a", "d"], c: [], d: [] };
  const order = bfs("a", (n: string) => adj[n] ?? []);
  assert.deepEqual(order, ["a", "b", "c", "d"]);
});

test("findInTree returns the DFS-first match even when its value is undefined", async () => {
  const { findInTree } = await import(ds("tree.ts"));
  const roots = [
    { value: "x", children: [{ value: undefined, children: [] }] },
    { value: "y", children: [] },
  ];
  const hit = findInTree(roots, (v: unknown) => v === undefined || v === "y");
  assert.equal(hit, undefined); // the undefined node is found before "y" (old code returned "y")
});
