import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { formatYmd } from './date';

/** Today's 'YYYY-MM-DD', re-read on focus so an overnight tab shows the right day without a clock read in render. */
export const useTodayKey = (): string => {
  const [today, setToday] = useState(() => formatYmd(new Date()));
  useFocusEffect(useCallback(() => setToday(formatYmd(new Date())), []));
  return today;
};
