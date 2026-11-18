import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';

import { useI18n } from '@/i18n';

import {
  formatDate,
  formatDateKey,
  formatDayMonth,
  formatMonth,
  type DateFormat,
} from './date-format';
import { SettingKeys, storage } from './storage';

/** Reactive date-format preference (MMKV hook): re-renders when Settings changes it. */
export const useDateFormat = () => {
  const [raw, setRaw] = useMMKVString(SettingKeys.dateFormat, storage);
  const { locale } = useI18n();
  const format = (raw as DateFormat | undefined) ?? 'system';

  const date = useCallback((d: Date) => formatDate(d, format, locale), [format, locale]);
  const dateKey = useCallback(
    (key: string) => formatDateKey(key, format, locale),
    [format, locale],
  );
  const dayMonth = useCallback((d: Date) => formatDayMonth(d, format, locale), [format, locale]);
  const month = useCallback(
    (d: Date, style: 'short' | 'long' = 'short') => formatMonth(d, locale, style),
    [locale],
  );

  return { format, setFormat: (next: DateFormat) => setRaw(next), date, dateKey, dayMonth, month };
};
