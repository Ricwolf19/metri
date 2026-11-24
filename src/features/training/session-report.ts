import type { PlannedSlot, SetLog, WorkoutLog } from '@/db/schema';

import { setVolumeKg } from './load';
import { estimate1Rm } from './progression';
import { plannedSets } from './rest-summary';
import { recordedDurationSeconds, sessionEndAt } from './session-end';
import { sessionTiming, type SessionTiming } from './session-timing';

/**
 * What a finished session adds up to, as plain data: the summary screen and
 * the share card read it, and every rule here is tested without a view.
 */

type WeightReps = { weightKg: number; reps: number };

/** The heaviest set; a tie keeps the one with more reps — the "top set" every summary names. */
export const topSetOf = <T extends WeightReps>(sets: readonly T[]): T | null =>
  sets.reduce<T | null>(
    (top, s) =>
      !top || s.weightKg > top.weightKg || (s.weightKg === top.weightKg && s.reps > top.reps)
        ? s
        : top,
    null,
  );

/** The best estimated 1RM (Epley) of the sets; null when none gives one (no load, too many reps). */
export const bestE1rmOf = (sets: readonly WeightReps[]): number | null =>
  sets.reduce<number | null>((best, s) => {
    const e1rm = estimate1Rm(s.weightKg, s.reps);
    return e1rm != null && (best == null || e1rm > best) ? e1rm : best;
  }, null);

/** Planned sets missed on a slot: its skipped rows, or every row left of a skipped exercise. */
export const missedSetsOf = (slot: PlannedSlot, done: number): number =>
  // An exercise added today was never the plan, so leaving it open misses
  // nothing: counted, it read "20/20 · missed 1".
  slot.added
    ? 0
    : slot.skipped
      ? Math.max(0, plannedSets(slot) - done)
      : (slot.skippedSets?.length ?? 0);

/** The plan's sets: what the session set out to do. An exercise added today is not the plan. */
export const plannedSetCount = (snapshot: readonly PlannedSlot[]): number =>
  snapshot.reduce((n, p) => (p.added ? n : n + plannedSets(p)), 0);

/** "45m", "1h 05m" — a session's length, to the minute. */
export const durationText = (seconds: number): string => {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};

/**
 * Why an exercise is the session's top one — `pickTopExercise` tries them in
 * this order: `progress` (its estimated 1RM rose the most against the previous
 * session of this split), `record` (no rise anywhere: the heaviest record of
 * the session, by estimated 1RM), `volume` (neither: the most volume moved).
 */
type TopReason = 'progress' | 'record' | 'volume';

export type SessionTop = {
  exerciseId: string;
  name: string;
  reason: TopReason;
  /** Its top set this session. */
  topKg: number;
  topReps: number;
  /** `progress` only: the estimated 1RM against last time, as a fraction (0.04 = +4 %). */
  gain: number | null;
  volumeKg: number;
};

export type TopCandidate = {
  exerciseId: string;
  name: string;
  topKg: number;
  topReps: number;
  isPr: boolean;
  volumeKg: number;
  setCount: number;
  /** This session's best estimated 1RM. */
  e1rmKg: number | null;
  /** The best of the previous session of this split, when it trained the exercise. */
  previousE1rmKg: number | null;
};

/** Float noise below this is no gain: 100 × 6 twice is the same set. */
const MIN_GAIN = 0.001;

const asTop = (row: TopCandidate, reason: TopReason, gain: number | null): SessionTop => ({
  exerciseId: row.exerciseId,
  name: row.name,
  reason,
  topKg: row.topKg,
  topReps: row.topReps,
  gain,
  volumeKg: row.volumeKg,
});

/** The exercise the session is remembered by (see `TopReason`); candidates in logging order. */
export const pickTopExercise = (rows: readonly TopCandidate[]): SessionTop | null => {
  let progress: { row: TopCandidate; gain: number } | null = null;
  for (const row of rows) {
    if (row.e1rmKg == null || !(row.previousE1rmKg != null && row.previousE1rmKg > 0)) continue;
    const gain = row.e1rmKg / row.previousE1rmKg - 1;
    if (gain > MIN_GAIN && (!progress || gain > progress.gain)) progress = { row, gain };
  }
  if (progress) return asTop(progress.row, 'progress', progress.gain);
  const strength = (r: TopCandidate) => r.e1rmKg ?? r.topKg;
  const record = rows
    .filter((r) => r.isPr)
    .reduce<TopCandidate | null>(
      (best, r) => (!best || strength(r) > strength(best) ? r : best),
      null,
    );
  if (record) return asTop(record, 'record', null);
  const most = rows.reduce<TopCandidate | null>(
    (best, r) =>
      !best ||
      r.volumeKg > best.volumeKg ||
      (r.volumeKg === best.volumeKg && r.setCount > best.setCount)
        ? r
        : best,
    null,
  );
  return most ? asTop(most, 'volume', null) : null;
};

/** One exercise of the session as the summary lists it. */
export type ReportExercise = {
  exerciseId: string;
  name: string;
  /** Working sets in the order they were logged. */
  sets: SetLog[];
  volumeKg: number;
  /** Planned sets it missed (skipped, or left when the session closed). */
  missed: number;
  isPr: boolean;
  /** Its top set the previous session of this split, and the estimated 1RM change since. */
  vsLast: { weightKg: number; reps: number; e1rmGain: number | null } | null;
};

/** The session against the previous one of the same split, before it. */
type SessionComparison = {
  logId: string;
  weekNumber: number;
  finishedAt: Date | null;
  volumeDeltaKg: number;
  /** Fraction (0.08 = +8 %); null when last time moved no volume. */
  volumeGain: number | null;
  setsDelta: number;
  /** Null when either length is not a trained one (`COMPARABLE_SECONDS`). */
  durationDeltaSeconds: number | null;
};

/**
 * A recorded length past this is a session left open, not one trained: older
 * builds counted until the finish tap, and a ten-hour "session" compared with
 * a real one says nothing.
 */
export const COMPARABLE_SECONDS = 4 * 60 * 60;

export type SessionReport = {
  durationSeconds: number;
  volumeKg: number;
  setsDone: number;
  /** The plan's sets (`plannedSetCount`); 0 for a session with no plan. */
  setsPlanned: number;
  missedSets: number;
  exercises: ReportExercise[];
  vsLast: SessionComparison | null;
  /** Null for a session with no working set. */
  timing: SessionTiming | null;
};

const byExercise = (sets: readonly SetLog[]): Map<string, SetLog[]> => {
  const groups = new Map<string, SetLog[]>();
  for (const s of sets) groups.set(s.exerciseId, [...(groups.get(s.exerciseId) ?? []), s]);
  return groups;
};

const volumeOf = (sets: readonly SetLog[]): number => sets.reduce((n, s) => n + setVolumeKg(s), 0);

const gainOf = (now: number | null, then: number | null): number | null =>
  now != null && then != null && then > 0 ? now / then - 1 : null;

/**
 * Everything the summary screen shows that the plain `sessionSummary` does
 * not: each exercise with its sets and what it missed, the comparison with the
 * previous session of the split and the time breakdown. `sets` are WORKING
 * sets, oldest first; `nameOf` resolves an exercise's display name.
 */
export const buildSessionReport = ({
  log,
  sets,
  nameOf,
  prIds,
  previous,
  defaultRestSeconds,
}: {
  log: Pick<WorkoutLog, 'startedAt' | 'durationSeconds' | 'completedAt' | 'plannedSnapshot'>;
  sets: readonly SetLog[];
  nameOf: (exerciseId: string, fallback?: string) => string;
  /** Exercises that set a record this session (`sessionSummary`). */
  prIds: ReadonlySet<string>;
  previous: {
    log: Pick<WorkoutLog, 'id' | 'weekNumber' | 'completedAt' | 'durationSeconds'>;
    sets: readonly SetLog[];
  } | null;
  /** The rest a slot with none planned runs at (the session screen's fallback). */
  defaultRestSeconds: number;
}): SessionReport => {
  const snapshot = log.plannedSnapshot ?? [];
  const groups = byExercise(sets);
  const doneFor = (exerciseId: string) => groups.get(exerciseId)?.length ?? 0;
  const missedByExercise = new Map<string, number>();
  for (const slot of snapshot) {
    const missed = missedSetsOf(slot, doneFor(slot.exerciseId));
    if (missed)
      missedByExercise.set(slot.exerciseId, (missedByExercise.get(slot.exerciseId) ?? 0) + missed);
  }
  const previousGroups = previous ? byExercise(previous.sets) : new Map<string, SetLog[]>();

  const exercises: ReportExercise[] = [...groups].map(([exerciseId, own]) => {
    const before = previousGroups.get(exerciseId);
    const thenTop = before ? topSetOf(before) : null;
    return {
      exerciseId,
      name: nameOf(exerciseId),
      sets: own,
      volumeKg: volumeOf(own),
      missed: missedByExercise.get(exerciseId) ?? 0,
      isPr: prIds.has(exerciseId),
      vsLast:
        before && thenTop
          ? {
              weightKg: thenTop.weightKg,
              reps: thenTop.reps,
              e1rmGain: gainOf(bestE1rmOf(own), bestE1rmOf(before)),
            }
          : null,
    };
  });
  // An exercise missed outright has no sets to list it by: it follows, in plan order.
  for (const slot of snapshot) {
    const missed = missedByExercise.get(slot.exerciseId) ?? 0;
    if (!missed || exercises.some((e) => e.exerciseId === slot.exerciseId)) continue;
    exercises.push({
      exerciseId: slot.exerciseId,
      name: nameOf(slot.exerciseId, slot.name),
      sets: [],
      volumeKg: 0,
      missed,
      isPr: false,
      vsLast: null,
    });
  }

  const startedAt = log.startedAt.getTime();
  const durationSeconds = recordedDurationSeconds(log, startedAt);
  // Read with today's end rule: older builds saved the length up to the finish
  // tap, and a session closed two hours after its last set read as 70 % idle.
  const lastSetAt = sets.length ? Math.max(...sets.map((s) => s.createdAt.getTime())) : null;
  const endedAt = sessionEndAt({
    startedAt,
    lastActivityAt: lastSetAt,
    now: startedAt + durationSeconds * 1000,
  });
  // Unrounded: every display rounds in ITS unit (`fromKgHalf`); whole kg first
  // drifted a lb gym's 100 × 20 to "1999.5 lb".
  const volumeKg = volumeOf(sets);
  const plannedRest = new Map(snapshot.map((p) => [p.exerciseId, p.restSeconds]));
  const comparable = (s: number | null | undefined) =>
    s != null && s > 0 && s <= COMPARABLE_SECONDS;
  const previousVolume = previous ? volumeOf(previous.sets) : 0;

  return {
    durationSeconds,
    volumeKg,
    setsDone: sets.length,
    setsPlanned: plannedSetCount(snapshot),
    missedSets: [...missedByExercise.values()].reduce((n, m) => n + m, 0),
    exercises,
    vsLast: previous
      ? {
          logId: previous.log.id,
          weekNumber: previous.log.weekNumber,
          finishedAt: previous.log.completedAt,
          volumeDeltaKg: volumeKg - previousVolume,
          volumeGain: previousVolume > 0 ? volumeKg / previousVolume - 1 : null,
          setsDelta: sets.length - previous.sets.length,
          durationDeltaSeconds:
            comparable(durationSeconds) && comparable(previous.log.durationSeconds)
              ? durationSeconds - (previous.log.durationSeconds ?? 0)
              : null,
        }
      : null,
    timing: sessionTiming({
      startedAt,
      endedAt,
      sets: sets.map((s) => ({
        exerciseId: s.exerciseId,
        loggedAt: s.createdAt.getTime(),
        restBeforeSeconds: s.restBeforeSeconds,
      })),
      plannedRestFor: (exerciseId) => plannedRest.get(exerciseId) ?? defaultRestSeconds,
    }),
  };
};
