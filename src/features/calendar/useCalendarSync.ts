import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useLiveQuery } from '@/db/useLiveQuery';
import { activeEnrollmentQuery } from '@/features/training/enroll';

import { syncTrainingCalendar } from './sync';

/**
 * Keeps the phone-calendar mirror current, mounted in the tabs layout: on
 * launch, on every return to the foreground (the window rolls forward a day at
 * a time) and whenever the enrollment moves — a finished week or phase, a
 * rescheduled split (`refreshTrainingWeekdays` stamps the row). The sync
 * itself is a no-op while the mirror is off, and only writes what changed.
 */
export const useCalendarSync = (userId: string | undefined) => {
  const { data } = useLiveQuery(activeEnrollmentQuery(userId ?? ''), [userId]);
  const row = data[0];
  const stamp = row
    ? `${row.id}|${row.status}|${row.currentRoutineId}|${row.currentWeek}|${row.updatedAt.getTime()}`
    : '';

  useEffect(() => {
    if (userId) void syncTrainingCalendar(userId);
  }, [userId, stamp]);

  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncTrainingCalendar(userId);
    });
    return () => sub.remove();
  }, [userId]);
};
