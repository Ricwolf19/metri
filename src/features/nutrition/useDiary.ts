import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { addDays } from '@/features/body/weekly';

import { byMeal, sumTotals, weeklyIntake } from './diary';
import { dayEntriesQuery, entriesSinceQuery } from './food-log.repo';

/** One day of the diary plus the 7-day average ending on `today`. */
export const useDiary = (userId: string, date: string, today: string) => {
  const weekStart = addDays(today, -6);
  const { data: entries } = useLiveQuery(dayEntriesQuery(userId, date), [userId, date]);
  const { data: week } = useLiveQuery(entriesSinceQuery(userId, weekStart), [userId, weekStart]);

  return useMemo(
    () => ({
      entries,
      meals: byMeal(entries),
      totals: sumTotals(entries),
      week: weeklyIntake(week, weekStart, today),
    }),
    [entries, week, weekStart, today],
  );
};
