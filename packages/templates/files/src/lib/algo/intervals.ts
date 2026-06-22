// src/lib/algo/intervals.ts — overlap detection via sweep (appointments, room booking)
export interface Interval { start: number; end: number; }
export function hasOverlap(intervals: readonly Interval[]): boolean {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) if (sorted[i]!.start < sorted[i - 1]!.end) return true;
  return false;
}
