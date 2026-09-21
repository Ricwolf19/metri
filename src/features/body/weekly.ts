import { dateFromKey, localDateKey } from '@/features/training/dates';

/**
 * Weigh-ins judged the only way they mean anything: as a WEEKLY AVERAGE.
 * A single reading swings a kilo or two on water and food alone, so one day is
 * noise; seven days averaged is the signal every decision here is made on.
 */

export type WeighIn = { date: string; weightKg: number };

/** Fewer readings than this and a week's average is too thin to act on. */
export const MIN_WEIGH_INS = 3;

/** A day-to-day move this large is water and gut content, not tissue. */
const WATER_JUMP_KG = 1;

const MS_PER_DAY = 86_400_000;

/** Whole days from `a` to `b` (both 'YYYY-MM-DD'). Rounded, so a DST shift
 * between two local midnights cannot turn 7 days into 6.96. */
export const daysBetween = (a: string, b: string): number =>
  Math.round((dateFromKey(b).getTime() - dateFromKey(a).getTime()) / MS_PER_DAY);

export const addDays = (key: string, days: number): string => {
  const d = dateFromKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
};

/**
 * Which 7-day block a date falls in, counted from `anchor`. Blocks are anchored
 * to the phase's start — NOT to calendar weeks — so moving the check-in weekday
 * mid-phase never re-buckets the history.
 */
export const weekIndexOf = (date: string, anchor: string): number =>
  Math.floor(daysBetween(anchor, date) / 7);

export type WeekAverage = {
  index: number;
  weekStart: string;
  /** Null when the week holds no weigh-in at all. */
  avgKg: number | null;
  n: number;
  confidence: 'ok' | 'low' | 'none';
};

/** Weeks `0..weeks-1` from `anchor`, each averaged; empty weeks are kept so the
 * calendar can show them as pending rather than collapsing the timeline. */
export const weeklyAverages = (
  entries: readonly WeighIn[],
  anchor: string,
  weeks: number,
): WeekAverage[] => {
  const buckets = Array.from({ length: Math.max(0, weeks) }, () => [] as number[]);
  for (const e of entries) {
    const i = weekIndexOf(e.date, anchor);
    if (i >= 0 && i < buckets.length) buckets[i].push(e.weightKg);
  }
  return buckets.map((values, index) => {
    const n = values.length;
    return {
      index,
      weekStart: addDays(anchor, index * 7),
      avgKg: n ? Math.round((values.reduce((a, b) => a + b, 0) / n) * 100) / 100 : null,
      n,
      confidence: n === 0 ? 'none' : n < MIN_WEIGH_INS ? 'low' : 'ok',
    };
  });
};

/** True when today's reading jumped enough to deserve the "it's water" note. */
export const isWaterJump = (previousKg: number | null, nextKg: number): boolean =>
  previousKg != null && Math.abs(nextKg - previousKg) >= WATER_JUMP_KG;
