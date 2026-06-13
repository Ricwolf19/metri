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

export const formatTime = (hour: number, minute: number): string => `${pad2(hour)}:${pad2(minute)}`;
