// src/lib/ds/tree.ts — hierarchy traversal (nav, org units, threaded notes)
export interface TreeNode<T> { value: T; children: TreeNode<T>[]; }

export function walkTree<T>(roots: readonly TreeNode<T>[], visit: (v: T, depth: number) => void, depth = 0): void {
  for (const n of roots) { visit(n.value, depth); walkTree(n.children, visit, depth + 1); }
}

export function findInTree<T>(roots: readonly TreeNode<T>[], pred: (v: T) => boolean): T | undefined {
  for (const n of roots) {
    if (pred(n.value)) return n.value;
    const hit = findInTree(n.children, pred);
    if (hit !== undefined) return hit;
  }
  return undefined;
}
