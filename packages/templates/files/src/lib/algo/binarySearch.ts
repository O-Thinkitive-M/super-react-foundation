// src/lib/algo/binarySearch.ts — first index whose value >= target (lower-bound)
export function lowerBound<T>(sorted: readonly T[], target: number, valueOf: (t: T) => number): number {
  let lo = 0, hi = sorted.length;            // [lo, hi)
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (valueOf(sorted[mid]!) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;                                  // == length if none qualify
}
