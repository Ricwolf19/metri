import { formatYmd } from '@/lib/date';

/** Device-local calendar day as 'YYYY-MM-DD'. */
export const localDateKey = (d: Date = new Date()): string => formatYmd(d);

/** Parse a 'YYYY-MM-DD' key back to a local-midnight Date (no UTC shift). */
export const dateFromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Expo weekday for a local-midnight cursor. */
export const weekdayOf = (d: Date): number => d.getDay() + 1;
