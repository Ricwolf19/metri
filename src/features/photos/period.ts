import type { ProgressPhoto } from '@/db/schema';
import { formatYearMonth, formatYmd } from '@/lib/date';

export type Period = 'day' | 'week' | 'month';

export const PERIODS: Period[] = ['day', 'week', 'month'];

/** Monday-based start of the week for a date, as a local yyyy-mm-dd string. */
const weekStart = (d: Date): string => {
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  return formatYmd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset));
};

const keyFor = (date: Date, period: Period): string => {
  if (period === 'day') return formatYmd(date);
  if (period === 'month') return formatYearMonth(date);
  return weekStart(date);
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
