import type { PlannedSlot, SetGroup } from '@/db/schema';

/**
 * Effort analytics: did the lifter train at the intensity the program asked
 * for? metri prescribes RIR ranges per week AND records RIR per set, so the
 * comparison is measured on both sides rather than inferred from load.
 *
 * Planned targets are read from the session's own `plannedSnapshot`, not from
 * the live program, so editing a program later never rewrites past verdicts.
 */

/** A set counts as "hard" at 2 reps in reserve or fewer — the working range
 * where hypertrophy evidence is strongest. */
const HARD_SET_RIR = 2;

export type EffortSet = {
  exerciseId: string;
  rir: number | null;
  isFailure: boolean;
};

const isHardSet = (set: EffortSet): boolean =>
  set.isFailure || (set.rir != null && set.rir <= HARD_SET_RIR);

export const hardSetCount = (sets: readonly EffortSet[]): number => sets.filter(isHardSet).length;

/** Mean recorded RIR. Null when nothing was recorded — never a misleading 0. */
export const averageRir = (sets: readonly EffortSet[]): number | null => {
  const recorded = sets.filter((s) => s.rir != null).map((s) => s.rir as number);
  if (!recorded.length) return null;
  return Math.round((recorded.reduce((a, b) => a + b, 0) / recorded.length) * 10) / 10;
};

export type EffortTarget = {
  exerciseId: string;
  rirMin: number | null;
  rirMax: number | null;
  toFailure: boolean;
};

/** Flatten a session's snapshot into one target per prescribed set, in order. */
export const expandTargets = (snapshot: readonly PlannedSlot[] | null): EffortTarget[] =>
  (snapshot ?? []).flatMap((slot) =>
    slot.setGroups.flatMap((group: SetGroup) =>
      Array.from({ length: Math.max(0, group.sets) }, () => ({
        exerciseId: slot.exerciseId,
        rirMin: group.rirMin ?? null,
        rirMax: group.rirMax ?? null,
        toFailure: group.toFailure ?? false,
      })),
    ),
  );

/**
 * `easy` = more reps left in reserve than prescribed (under-reaching),
 * `hard` = fewer (over-reaching). `unknown` covers a set with no recorded RIR
 * or a prescription that set no intensity — silence, not a verdict.
 */
export type EffortVerdict = 'on_target' | 'easy' | 'hard' | 'unknown';

export const compareEffort = (set: EffortSet, target: EffortTarget | undefined): EffortVerdict => {
  if (!target) return 'unknown';
  if (target.toFailure) {
    if (set.isFailure) return 'on_target';
    if (set.rir == null) return 'unknown';
    return set.rir === 0 ? 'on_target' : 'easy';
  }
  if (target.rirMin == null && target.rirMax == null) return 'unknown';
  // Failure means zero reps in reserve; treat it as such against a range.
  const actual = set.isFailure ? 0 : set.rir;
  if (actual == null) return 'unknown';

  const min = target.rirMin ?? target.rirMax!;
  const max = target.rirMax ?? target.rirMin!;
  if (actual > max) return 'easy';
  if (actual < min) return 'hard';
  return 'on_target';
};

export type EffortAdherence = Record<EffortVerdict, number> & { total: number };

/**
 * Zip a session's working sets against its prescription, per exercise and in
 * logged order. Extra sets beyond the plan have no target and land in
 * `unknown` rather than being scored against a prescription that never existed.
 */
export const sessionAdherence = (
  snapshot: readonly PlannedSlot[] | null,
  sets: readonly EffortSet[],
): EffortAdherence => {
  const queues = new Map<string, EffortTarget[]>();
  for (const target of expandTargets(snapshot)) {
    const queue = queues.get(target.exerciseId) ?? [];
    queue.push(target);
    queues.set(target.exerciseId, queue);
  }

  const out: EffortAdherence = { on_target: 0, easy: 0, hard: 0, unknown: 0, total: 0 };
  for (const set of sets) {
    const verdict = compareEffort(set, queues.get(set.exerciseId)?.shift());
    out[verdict] += 1;
    out.total += 1;
  }
  return out;
};

/** Share of scored sets that hit the prescription; null when none were scored. */
export const adherenceRate = (a: EffortAdherence): number | null => {
  const scored = a.on_target + a.easy + a.hard;
  return scored ? Math.round((a.on_target / scored) * 100) : null;
};
