import type { ProgressPhoto } from '@/db/schema';

export type Period = 'day' | 'week' | 'month';

export const PERIODS: Period[] = ['day', 'week', 'month'];

/** Monday-based start of the week for a date, as an ISO yyyy-mm-dd string. */
const weekStart = (d: Date): string => {
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return s.toISOString().slice(0, 10);
};

const keyFor = (iso: string, period: Period): string => {
  if (period === 'day') return iso.slice(0, 10);
  if (period === 'month') return iso.slice(0, 7);
  return weekStart(new Date(iso));
};

export type PhotoGroup = { key: string; items: ProgressPhoto[] };

/**
 * Group photos (already sorted newest-first) into day / week / month buckets,
 * keeping groups in newest-first order.
 */
export const groupByPeriod = (photos: ProgressPhoto[], period: Period): PhotoGroup[] => {
  const map = new Map<string, ProgressPhoto[]>();
  for (const p of photos) {
    const key = keyFor(p.takenAt, period);
    const bucket = map.get(key);
    if (bucket) bucket.push(p);
    else map.set(key, [p]);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({ key, items }));
};
