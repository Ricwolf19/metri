import { useEffect, useMemo } from 'react';

import type { Sex } from '@/db/schema';
import { useLiveQuery } from '@/db/useLiveQuery';
import { goalsQuery } from '@/features/body/body-goals.repo';
import { measurementsQuery } from '@/features/body/body-measurements.repo';
import { bodyMetricsQuery } from '@/features/body/body-metrics.repo';
import { keySiteFor, type SiteId } from '@/features/body/sites';
import type { WeighIn } from '@/features/body/weekly';

import { groupCheckins, type CheckinEntry } from './checkins';
import { adoptLegacyPhotos, checkinsQuery, mediaQuery } from './photos.repo';
import { checkinStats, type CheckinStats } from './stats';

export type ProgressEntry = CheckinEntry & { stats: CheckinStats };

/**
 * Every check-in of a user with its photos, clips and what the body log said
 * around it — the one read the timeline, a check-in, the camera's ghost, the
 * comparison and the share composer all draw from. Newest first.
 */
export const useProgressLog = (userId: string, sex: Sex | null) => {
  // Photos from before check-ins get filed once; the live queries pick it up.
  useEffect(() => {
    if (userId) adoptLegacyPhotos(userId);
  }, [userId]);

  const { data: checkins } = useLiveQuery(checkinsQuery(userId), [userId]);
  const { data: media } = useLiveQuery(mediaQuery(userId), [userId]);
  const { data: metrics } = useLiveQuery(bodyMetricsQuery(userId, ''), [userId]);
  const { data: tape } = useLiveQuery(measurementsQuery(userId, ''), [userId]);
  const { data: goals } = useLiveQuery(goalsQuery(userId), [userId]);
  const keySite: SiteId = keySiteFor(sex);

  const entries = useMemo((): ProgressEntry[] => {
    const weighIns: WeighIn[] = metrics.flatMap((m) =>
      m.weightKg != null ? [{ date: m.date, weightKg: m.weightKg }] : [],
    );
    const siteTape = tape
      .filter((m) => m.site === keySite)
      .map((m) => ({ date: m.date, valueCm: m.valueCm }));
    return groupCheckins(checkins, media).map((entry) => ({
      ...entry,
      stats: checkinStats(entry.checkin.date, { weighIns, tape: siteTape, goals }),
    }));
  }, [checkins, media, metrics, tape, goals, keySite]);

  return { entries, keySite };
};
