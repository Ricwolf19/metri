import type { BodyGoal, BodyPhase } from '@/db/schema';
import { addDays, daysBetween, weekIndexOf, type WeighIn } from '@/features/body/weekly';
import { localDateKey } from '@/features/training/dates';

/** One reading of the key tape site (waist for men, hips for women). */
export type TapeReading = { date: string; valueCm: number };

/**
 * What the body log said around a check-in, read the way the Metrics tab reads
 * it: weight as the 7-day average ending that day (one weigh-in is water), the
 * key tape site from the last two weeks, and the nutrition phase it fell in.
 */
export type CheckinStats = {
  avgKg: number | null;
  /** How many weigh-ins the average holds: under `MIN_WEIGH_INS` it reads as rough. */
  weighIns: number;
  siteCm: number | null;
  /** Week 1 is the phase's first seven days. */
  phase: { phase: BodyPhase; week: number } | null;
};

const WEIGHT_WINDOW_DAYS = 7;
const TAPE_WINDOW_DAYS = 14;

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The phase running on `date`: started by then and not ended before it; the newest wins. */
export const phaseOn = (
  goals: readonly Pick<BodyGoal, 'phase' | 'startDate' | 'endedAt'>[],
  date: string,
): CheckinStats['phase'] => {
  let found: (typeof goals)[number] | null = null;
  for (const goal of goals) {
    if (goal.startDate > date) continue;
    if (goal.endedAt && localDateKey(goal.endedAt) < date) continue;
    if (!found || goal.startDate > found.startDate) found = goal;
  }
  return found ? { phase: found.phase, week: weekIndexOf(date, found.startDate) + 1 } : null;
};

export const checkinStats = (
  date: string,
  log: {
    /** Oldest first. */
    weighIns: readonly WeighIn[];
    /** Oldest first, key site only. */
    tape: readonly TapeReading[];
    goals: readonly Pick<BodyGoal, 'phase' | 'startDate' | 'endedAt'>[];
  },
): CheckinStats => {
  const from = addDays(date, -(WEIGHT_WINDOW_DAYS - 1));
  const week = log.weighIns.filter((w) => w.date >= from && w.date <= date);
  const avgKg = week.length
    ? Math.round((week.reduce((sum, w) => sum + w.weightKg, 0) / week.length) * 100) / 100
    : null;

  const tapeFrom = addDays(date, -(TAPE_WINDOW_DAYS - 1));
  let siteCm: number | null = null;
  for (const reading of log.tape) {
    if (reading.date > date) break;
    if (reading.date >= tapeFrom) siteCm = reading.valueCm;
  }

  return { avgKg, weighIns: week.length, siteCm, phase: phaseOn(log.goals, date) };
};

/** From `before` to `after`: days between, and the change in weight and tape (null when either side lacks it). */
export type CompareDelta = { days: number; kg: number | null; cm: number | null };

export const compareDelta = (
  before: { date: string; stats: CheckinStats },
  after: { date: string; stats: CheckinStats },
): CompareDelta => ({
  days: daysBetween(before.date, after.date),
  kg:
    before.stats.avgKg != null && after.stats.avgKg != null
      ? round1(after.stats.avgKg - before.stats.avgKg)
      : null,
  cm:
    before.stats.siteCm != null && after.stats.siteCm != null
      ? round1(after.stats.siteCm - before.stats.siteCm)
      : null,
});
