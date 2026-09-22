import { formatYmd } from '@/lib/date';

/** Device-local calendar day as 'YYYY-MM-DD'. */
export const localDateKey = (d: Date = new Date()): string => formatYmd(d);

/** Parse a 'YYYY-MM-DD' key back to a local-midnight Date (no UTC shift). */
export const dateFromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** A local day as [midnight, next midnight) — the window its instants fall in. */
export const dayBounds = (key: string): [Date, Date] => {
  const start = dateFromKey(key);
  return [start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)];
};

/** Expo weekday for a local-midnight cursor. */
export const weekdayOf = (d: Date): number => d.getDay() + 1;
