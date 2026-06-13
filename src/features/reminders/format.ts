import type { ClockFormat } from '@/lib/storage';
import type { TranslationKey } from '@/i18n/en';

/** i18n keys for weekdays, indexed by `weekday - 1` (1 = Sunday … 7 = Saturday). */
export const DAY_KEYS: TranslationKey[] = [
  'day.sun',
  'day.mon',
  'day.tue',
  'day.wed',
  'day.thu',
  'day.fri',
  'day.sat',
];

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Format a 24h `hour`/`minute` for display. `clock` is display-only — values are
 * always stored 24h. 12h renders e.g. "8:05 AM" / "6:30 PM".
 */
export const formatTime = (hour: number, minute: number, clock: ClockFormat = '24'): string => {
  if (clock === '12') {
    const period = hour < 12 ? 'AM' : 'PM';
    const h12 = hour % 12 || 12;
    return `${h12}:${pad2(minute)} ${period}`;
  }
  return `${pad2(hour)}:${pad2(minute)}`;
};
