import type { SwipeResult } from '../types';

// Leitner box system: box index -> review interval in days
const BOX_INTERVALS = [0, 1, 2, 4, 7, 15];
export const MAX_BOX = BOX_INTERVALS.length - 1;

export function todayStr(): string {
  return formatDate(new Date());
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function nextSrsState(
  currentBox: number,
  result: SwipeResult,
): { box: number; nextReviewDate: string } {
  if (result === 'know') {
    const box = Math.min(currentBox + 1, MAX_BOX);
    return { box, nextReviewDate: addDays(todayStr(), BOX_INTERVALS[box]) };
  }
  return { box: 0, nextReviewDate: addDays(todayStr(), 1) };
}

export function isDueToday(nextReviewDate: string): boolean {
  return nextReviewDate <= todayStr();
}
