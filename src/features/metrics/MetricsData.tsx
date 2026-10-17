import { useLiveQuery } from '@/db/useLiveQuery';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { bucketVolume, weeklyVolumeQuery, type WeekVolume } from '@/features/training/stats.repo';

const WEEKS = 6;

const WeeklyVolumeContext = createContext<WeekVolume[] | null>(null);

/**
 * The reads several Metrics sections share, subscribed ONCE for the tab: the
 * summary and the analytics both showed the weekly volume, each with its own
 * live query over `set_logs`, so every logged set re-ran the same SQL twice.
 */
export const MetricsDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { data: rows } = useLiveQuery(weeklyVolumeQuery(userId, WEEKS), [userId]);
  const volume = useMemo(() => bucketVolume(rows, WEEKS), [rows]);
  return <WeeklyVolumeContext.Provider value={volume}>{children}</WeeklyVolumeContext.Provider>;
};

/** The last six weeks of volume (kg), oldest first; empty outside the provider. */
export const useWeeklyVolume = (): WeekVolume[] => useContext(WeeklyVolumeContext) ?? [];
