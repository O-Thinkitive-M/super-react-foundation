// src/lib/ds/tree.ts — hierarchy traversal (nav, org units, threaded notes)
export interface TreeNode<T> { value: T; children: TreeNode<T>[]; }

export function walkTree<T>(roots: readonly TreeNode<T>[], visit: (v: T, depth: number) => void, depth = 0): void {
  for (const n of roots) { visit(n.value, depth); walkTree(n.children, visit, depth + 1); }
}

const NOT_FOUND = Symbol("not-found");

function searchTree<T>(roots: readonly TreeNode<T>[], pred: (v: T) => boolean): T | typeof NOT_FOUND {
  for (const n of roots) {
    if (pred(n.value)) return n.value;
    const hit = searchTree(n.children, pred);
    if (hit !== NOT_FOUND) return hit;
  }
  return NOT_FOUND;
}

export function findInTree<T>(roots: readonly TreeNode<T>[], pred: (v: T) => boolean): T | undefined {
  const hit = searchTree(roots, pred);
  return hit === NOT_FOUND ? undefined : hit;
}
