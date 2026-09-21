import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import type { Sex } from '@/db/schema';
import { useTodayKey } from '@/lib/useTodayKey';

import { activeGoalQuery } from './body-goals.repo';
import { latestPerSite, measurementsQuery } from './body-measurements.repo';
import { bodyMetricsQuery } from './body-metrics.repo';
import { buildCalendar } from './calendar';
import { interpretWeek } from './interpret';
import { keySiteFor } from './sites';
import { addDays, weekIndexOf, weeklyAverages, type WeighIn } from './weekly';

/** Without a phase there is no anchor to count weeks from, so look back this far. */
const LOOKBACK_DAYS = 84;

/**
 * The body log as both tabs read it: weigh-ins bucketed into weeks, the phase's
 * planned-vs-actual calendar, and the combined reading of scale + tape.
 *
 * Weeks are anchored to the running phase's start; with no phase they are
 * anchored `LOOKBACK_DAYS` back from today, which is stable within a day.
 */
export const useBodyLog = (userId: string, sex: Sex | null) => {
  const today = useTodayKey();
  const { data: goals } = useLiveQuery(activeGoalQuery(userId), [userId]);
  const goal = goals[0] ?? null;

  const anchor = goal?.startDate ?? addDays(today, -LOOKBACK_DAYS + 1);
  const { data: metrics } = useLiveQuery(bodyMetricsQuery(userId, anchor), [userId, anchor]);
  const { data: tape } = useLiveQuery(measurementsQuery(userId, anchor), [userId, anchor]);

  return useMemo(() => {
    const weighIns: WeighIn[] = metrics.flatMap((m) =>
      m.weightKg != null ? [{ date: m.date, weightKg: m.weightKg }] : [],
    );
    const currentWeek = Math.max(0, weekIndexOf(today, anchor));
    const totalWeeks = goal ? Math.max(goal.durationWeeks, currentWeek + 1) : currentWeek + 1;
    const weeks = weeklyAverages(weighIns, anchor, totalWeeks);
    const calendar = goal ? buildCalendar(goal, weeks) : [];

    // The two most recent weeks that actually hold weigh-ins.
    const withData = weeks.filter((w) => w.avgKg != null && w.index <= currentWeek);
    const thisWeek = withData[withData.length - 1] ?? null;
    const lastWeek = withData[withData.length - 2] ?? null;
    const weightDeltaKg =
      thisWeek?.avgKg != null && lastWeek?.avgKg != null
        ? Math.round((thisWeek.avgKg - lastWeek.avgKg) * 100) / 100
        : null;

    const bySite = latestPerSite(tape);
    const keySite = keySiteFor(sex);
    const key = bySite.get(keySite);
    const keySiteDeltaCm = key?.previous
      ? Math.round((key.latest.valueCm - key.previous.valueCm) * 10) / 10
      : null;

    return {
      today,
      goal,
      weighIns,
      latestWeighIn: weighIns[weighIns.length - 1] ?? null,
      weeks,
      calendar,
      currentWeek,
      thisWeek,
      weightDeltaKg,
      bySite,
      keySite,
      keySiteDeltaCm,
      reading: interpretWeek({
        phase: goal?.phase ?? null,
        weightDeltaKg,
        keySiteDeltaCm,
        weekIndex: currentWeek,
      }),
    };
  }, [metrics, tape, goal, anchor, today, sex]);
};
