// src/lib/algo/graph.ts — BFS over an adjacency Map (perms, referral chains)
export function bfs<N>(start: N, neighbors: (n: N) => Iterable<N>): N[] {
  const seen = new Set<N>([start]); const queue: N[] = [start]; const order: N[] = [];
  let head = 0;                                            // index cursor -> O(1) dequeue (shift is O(n))
  while (head < queue.length) {
    const n = queue[head++]!; order.push(n);
    for (const next of neighbors(n)) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return order;                                            // visited Set => cycle-safe
}
