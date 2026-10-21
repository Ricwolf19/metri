import { mondayOf } from './dates';
import { setVolumeKg } from './load';
import { estimate1Rm } from './progression';
import type { ExerciseSession } from './stats.repo';

/**
 * Per-exercise series for the trend card and the Metrics "most improved" rows.
 * Pure: `stats.repo` hands in sessions (warm-ups already excluded), this folds
 * them oldest → newest into one point per session. The PR definition is the
 * one `sessionSummary` uses — a top `weight_kg` above every earlier session,
 * the first session counting — so a star here is the star the finish modal
 * showed. e1RM is Epley and refuses sets beyond 12 reps (`estimate1Rm`), so a
 * high-rep day reads null rather than inflating the line.
 */

const DAY_MS = 86_400_000;

type SetPoint = { weightKg: number; reps: number; e1rmKg: number | null };

export type ExerciseSessionPoint = {
  logId: string;
  /** `completedAt` in epoch ms — the chart's x. */
  at: number;
  topKg: number;
  e1rmKg: number | null;
  volumeKg: number;
  sets: SetPoint[];
  isPr: boolean;
};

export const buildExerciseSeries = (
  sessions: readonly ExerciseSession[],
): ExerciseSessionPoint[] => {
  const ordered = [...sessions].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  let best = Number.NEGATIVE_INFINITY;
  return ordered.map((s) => {
    const sets = s.sets.map((x) => ({
      weightKg: x.weightKg,
      reps: x.reps,
      e1rmKg: estimate1Rm(x.weightKg, x.reps),
    }));
    const topKg = Math.max(0, ...s.sets.map((x) => x.weightKg));
    const e1rms = sets.map((x) => x.e1rmKg).filter((v): v is number => v != null);
    const e1rmKg = e1rms.length ? Math.max(...e1rms) : null;
    const volumeKg = Math.round(s.sets.reduce((sum, x) => sum + setVolumeKg(x), 0));
    const isPr = topKg > best;
    best = Math.max(best, topKg);
    return { logId: s.logId, at: s.completedAt.getTime(), topKg, e1rmKg, volumeKg, sets, isPr };
  });
};

export const prEvents = (points: readonly ExerciseSessionPoint[]): ExerciseSessionPoint[] =>
  points.filter((p) => p.isPr);

/** The heaviest set across every session; at equal weight the one with more reps. */
export const bestSetOf = (points: readonly ExerciseSessionPoint[]): SetPoint | null =>
  points
    .flatMap((p) => p.sets)
    .reduce<SetPoint | null>(
      (best, s) =>
        !best || s.weightKg > best.weightKg || (s.weightKg === best.weightKg && s.reps > best.reps)
          ? s
          : best,
      null,
    );

export type Improvement = {
  exerciseId: string;
  firstE1rmKg: number;
  lastE1rmKg: number;
  deltaKg: number;
  deltaPct: number;
  sessions: number;
};

/**
 * Exercises whose estimated 1RM rose inside the window, best delta first. The
 * baseline is the best of the FIRST two sessions and the current the best of
 * the LAST two, so one bad day at either end does not decide the ranking;
 * sessions without an e1RM (all sets over 12 reps) do not count toward
 * `minSessions`.
 */
export const mostImproved = (
  byExercise: ReadonlyMap<string, readonly ExerciseSessionPoint[]>,
  opts: { windowDays: number; minSessions: number; now: number },
): Improvement[] => {
  const since = opts.now - opts.windowDays * DAY_MS;
  const out: Improvement[] = [];
  for (const [exerciseId, points] of byExercise) {
    const rated = points.filter(
      (p): p is ExerciseSessionPoint & { e1rmKg: number } => p.at >= since && p.e1rmKg != null,
    );
    if (rated.length < opts.minSessions) continue;
    const firstE1rmKg = Math.max(...rated.slice(0, 2).map((p) => p.e1rmKg));
    const lastE1rmKg = Math.max(...rated.slice(-2).map((p) => p.e1rmKg));
    const deltaKg = lastE1rmKg - firstE1rmKg;
    if (deltaKg <= 0) continue;
    out.push({
      exerciseId,
      firstE1rmKg,
      lastE1rmKg,
      deltaKg,
      deltaPct: (deltaKg / firstE1rmKg) * 100,
      sessions: rated.length,
    });
  }
  return out.sort((a, b) => b.deltaPct - a.deltaPct);
};

export type ActiveExercise = { exerciseId: string; sessions: number; lastAt: number };

/** Exercises trained inside the window, most recently trained first. */
export const activeExercises = (
  byExercise: ReadonlyMap<string, readonly ExerciseSessionPoint[]>,
  opts: { windowDays: number; now: number },
): ActiveExercise[] => {
  const since = opts.now - opts.windowDays * DAY_MS;
  return [...byExercise.entries()]
    .map(([exerciseId, points]) => {
      const recent = points.filter((p) => p.at >= since);
      return { exerciseId, sessions: recent.length, lastAt: recent[recent.length - 1]?.at ?? 0 };
    })
    .filter((x) => x.sessions > 0)
    .sort((a, b) => b.lastAt - a.lastAt);
};

export type WeekTop = {
  /** Local Monday 00:00 of the week, epoch ms. */
  weekStart: number;
  topKg: number;
  sessions: number;
};

/**
 * The heaviest set of each trained week, oldest first, at most `weeks` of
 * them: the week-to-week read the chart by session hides when a lift is
 * trained twice one week and once the next. Weeks with nothing logged are
 * left out rather than drawn as zero.
 */
export const weeklyTops = (
  points: readonly ExerciseSessionPoint[],
  opts: { weeks: number },
): WeekTop[] => {
  const byWeek = new Map<number, WeekTop>();
  for (const p of points) {
    const weekStart = mondayOf(new Date(p.at)).getTime();
    const week = byWeek.get(weekStart);
    if (week) {
      week.topKg = Math.max(week.topKg, p.topKg);
      week.sessions += 1;
    } else byWeek.set(weekStart, { weekStart, topKg: p.topKg, sessions: 1 });
  }
  return [...byWeek.values()].sort((a, b) => a.weekStart - b.weekStart).slice(-opts.weeks);
};
