import type { BodyPhase } from '@/db/schema';

import type { WeekAverage } from './weekly';

/**
 * The weight calendar: one row per week of the phase, a TARGET weight derived
 * from where it started and how fast it should move, next to the week's actual
 * average. Planned vs actual — the same judgement metri applies to training.
 */

/** Closer than this to the target and the week is simply "on plan". */
const ON_TARGET_KG = 0.15;
/** Being this far AHEAD is a welcome cushion to hold, not a reason to push on. */
const CUSHION_KG = 0.3;
/** How far a maintenance/recomp week may drift before it counts as off. */
const MAINTAIN_DRIFT_KG = 0.5;

export type WeekStatus = 'ahead' | 'on' | 'behind' | 'low-data' | 'pending';

export type CalendarRow = {
  week: number;
  weekStart: string;
  targetKg: number;
  actualKg: number | null;
  /** actual − target; null until the week has data. */
  deltaKg: number | null;
  status: WeekStatus;
};

type GoalShape = { phase: BodyPhase; startWeightKg: number; rateKgPerWeek: number };

const round2 = (n: number): number => Math.round(n * 100) / 100;

const statusFor = (phase: BodyPhase, deltaKg: number): WeekStatus => {
  if (phase === 'maintain' || phase === 'recomp') {
    return Math.abs(deltaKg) <= MAINTAIN_DRIFT_KG ? 'on' : 'behind';
  }
  if (Math.abs(deltaKg) <= ON_TARGET_KG) return 'on';
  // Further along than planned: lighter on a cut, heavier on a bulk.
  const further = phase === 'cut' ? deltaKg < 0 : deltaKg > 0;
  return further ? 'ahead' : 'behind';
};

export const buildCalendar = (goal: GoalShape, weeks: readonly WeekAverage[]): CalendarRow[] =>
  weeks.map((w) => {
    const targetKg = round2(goal.startWeightKg + goal.rateKgPerWeek * w.index);
    if (w.avgKg == null) {
      return {
        week: w.index,
        weekStart: w.weekStart,
        targetKg,
        actualKg: null,
        deltaKg: null,
        status: 'pending',
      };
    }
    const deltaKg = round2(w.avgKg - targetKg);
    return {
      week: w.index,
      weekStart: w.weekStart,
      targetKg,
      actualKg: w.avgKg,
      deltaKg,
      // A thin week still shows its number, but is never judged on it.
      status: w.confidence === 'low' ? 'low-data' : statusFor(goal.phase, deltaKg),
    };
  });

export type Verdict = 'hold' | 'ease' | 'push';

/**
 * What to DO about a week. Ahead by a small cushion → hold it, don't chase
 * more; ahead by a lot → ease off, the rate is too aggressive; behind → push
 * (the levers come before the food). Null when the week cannot be judged.
 */
export const verdictFor = (row: CalendarRow): Verdict | null => {
  if (row.deltaKg == null || row.status === 'pending' || row.status === 'low-data') return null;
  if (row.status === 'behind') return 'push';
  if (row.status === 'ahead') return Math.abs(row.deltaKg) > CUSHION_KG ? 'ease' : 'hold';
  return 'hold';
};

/** The judged statuses, oldest → newest, for `suggestAdjustment`. */
export const judgedTrend = (rows: readonly CalendarRow[]): ('ahead' | 'on' | 'behind')[] =>
  rows.flatMap((r) =>
    r.status === 'ahead' || r.status === 'on' || r.status === 'behind' ? [r.status] : [],
  );
