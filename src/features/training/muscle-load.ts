import { CATEGORY_HEADS, knownHeads, MUSCLE_HEADS, type MuscleHead } from './muscles';
import { estimate1Rm } from './progression';

import type { ExerciseCategory } from '@/db/schema';

/**
 * Per-muscle training load: how much work each muscle got, how recently, and
 * how close to failure. Pure by design — callers pass rows in, no DB, no React —
 * so the models can be tuned against table-driven tests.
 * @see AGENTS.md#analytics
 */

/** A completed working set, joined to the exercise that produced it. */
export type LoadedSet = {
  exerciseId: string;
  reps: number;
  weightKg: number;
  /** Reps in reserve, null when the lifter did not record it. */
  rir: number | null;
  isFailure: boolean;
  /** Epoch ms. */
  at: number;
};

export type ExerciseMuscles = {
  primary: readonly string[] | null;
  secondary: readonly string[] | null;
  category: ExerciseCategory;
};

/** exerciseId → its muscle attribution. */
export type MuscleIndex = ReadonlyMap<string, ExerciseMuscles>;

// Fractional set counting, the convention in the hypertrophy literature: a
// primary mover earns a full set, a secondary half of one.
const PRIMARY_SHARE = 1;
const SECONDARY_SHARE = 0.5;

/** Effort assumed when a set carries no RIR — mid-range, so an unlabelled log
 * neither inflates nor erases the muscle's fatigue. */
const UNKNOWN_RIR_EFFORT = 0.7;

/** Weekly fractional-set band that counts as productive for a single muscle. */
export const WEEKLY_SET_TARGET = { min: 10, max: 20 } as const;

/**
 * Hours for a muscle's fatigue signal to halve. Large muscles carry heavier
 * absolute loads and recover slower; the two tiers are a deliberate
 * simplification of a continuum, not a measured constant.
 */
const SLOW_RECOVERY_H = 72;
const FAST_RECOVERY_H = 48;
const SLOW_RECOVERING: readonly MuscleHead[] = [
  'quads',
  'hamstrings',
  'glutes',
  'lats',
  'mid_back',
  'lower_back',
  'chest',
  'upper_chest',
];

const halfLifeFor = (head: MuscleHead): number =>
  SLOW_RECOVERING.includes(head) ? SLOW_RECOVERY_H : FAST_RECOVERY_H;

/** Decayed stimulus that reads as "fully worked" on the map. */
const FATIGUE_REFERENCE = 6;

const MS_PER_HOUR = 3_600_000;

/** Effort of a single set, 0–1. Failure is maximal; each rep left in reserve
 * discounts it, with a floor so even an easy set counts for something. */
export const setEffort = (rir: number | null, isFailure: boolean): number => {
  if (isFailure) return 1;
  if (rir == null) return UNKNOWN_RIR_EFFORT;
  return Math.max(0.2, Math.min(1, 1 - rir * 0.15));
};

/**
 * The heads an exercise trains, with each head's share of one set.
 *
 * The single definition of the attribution rule — the body map's fills and its
 * drilldown must agree, so both go through here rather than re-deriving it.
 */
export const headShares = (entry: ExerciseMuscles | undefined): Map<MuscleHead, number> => {
  const out = new Map<MuscleHead, number>();
  if (!entry) return out;

  const primary = knownHeads(entry.primary);
  const secondary = knownHeads(entry.secondary).filter((h) => !primary.includes(h));
  // An exercise naming no muscles at all (every custom one today) still has a
  // category, which is better than vanishing from the map entirely.
  const heads = primary.length ? primary : CATEGORY_HEADS[entry.category];

  for (const head of heads) out.set(head, PRIMARY_SHARE);
  for (const head of secondary) out.set(head, (out.get(head) ?? 0) + SECONDARY_SHARE);
  return out;
};

const sharesFor = (set: LoadedSet, index: MuscleIndex): Map<MuscleHead, number> =>
  headShares(index.get(set.exerciseId));

const emptyTotals = (): Record<MuscleHead, number> =>
  Object.fromEntries(MUSCLE_HEADS.map((h) => [h, 0])) as Record<MuscleHead, number>;

/** Every head is present, zeros included, so the body map can distinguish
 * "not trained" from "no such muscle". */
export const fractionalSets = (
  sets: readonly LoadedSet[],
  index: MuscleIndex,
): Record<MuscleHead, number> => {
  const totals = emptyTotals();
  for (const set of sets) {
    for (const [head, share] of sharesFor(set, index)) totals[head] += share;
  }
  return totals;
};

export type BalanceStatus = 'untrained' | 'low' | 'optimal' | 'high';

export type MuscleBalance = {
  head: MuscleHead;
  sets: number;
  status: BalanceStatus;
};

/** `weeks` normalizes a longer window back to a per-week rate, so the month and
 * quarter views stay comparable with the weekly band. */
export const muscleBalance = (
  sets: readonly LoadedSet[],
  index: MuscleIndex,
  weeks = 1,
): MuscleBalance[] => {
  const totals = fractionalSets(sets, index);
  const span = Math.max(1, weeks);
  return MUSCLE_HEADS.map((head) => {
    const perWeek = totals[head] / span;
    const status: BalanceStatus =
      perWeek === 0
        ? 'untrained'
        : perWeek < WEEKLY_SET_TARGET.min
          ? 'low'
          : perWeek > WEEKLY_SET_TARGET.max
            ? 'high'
            : 'optimal';
    return { head, sets: Math.round(perWeek * 10) / 10, status };
  });
};

export type MuscleFatigue = {
  head: MuscleHead;
  /** 0 = fully recovered, 1 = at or beyond a hard session's worth. */
  index: number;
};

/**
 * `stimulus = fractional sets × effort(RIR)`, decayed by time since the set.
 *
 * Weighting by RIR is what makes this more than a set count: a set to failure
 * loads a muscle far more than the same set with four reps left.
 * @see AGENTS.md#analytics — fatigue is a model, not a measurement.
 */
export const muscleFatigue = (
  sets: readonly LoadedSet[],
  index: MuscleIndex,
  now = Date.now(),
): MuscleFatigue[] => {
  const decayed = emptyTotals();
  for (const set of sets) {
    const hours = Math.max(0, (now - set.at) / MS_PER_HOUR);
    const effort = setEffort(set.rir, set.isFailure);
    for (const [head, share] of sharesFor(set, index)) {
      decayed[head] += share * effort * Math.pow(0.5, hours / halfLifeFor(head));
    }
  }
  return MUSCLE_HEADS.map((head) => ({
    head,
    index: Math.min(1, Math.round((decayed[head] / FATIGUE_REFERENCE) * 100) / 100),
  }));
};

export type MuscleStrength = {
  head: MuscleHead;
  /** Days since this muscle was last trained; null when never. */
  daysSince: number | null;
  /** Best estimated 1RM among the exercises training it; null when unknown. */
  bestE1rmKg: number | null;
};

/** Recency and the heaviest estimate each muscle has produced. */
export const muscleStrength = (
  sets: readonly LoadedSet[],
  index: MuscleIndex,
  now = Date.now(),
): MuscleStrength[] => {
  const lastAt = new Map<MuscleHead, number>();
  const bestE1rm = new Map<MuscleHead, number>();

  for (const set of sets) {
    const e1rm = estimate1Rm(set.weightKg, set.reps);
    for (const [head] of sharesFor(set, index)) {
      if (set.at > (lastAt.get(head) ?? 0)) lastAt.set(head, set.at);
      if (e1rm != null && e1rm > (bestE1rm.get(head) ?? 0)) bestE1rm.set(head, e1rm);
    }
  }

  return MUSCLE_HEADS.map((head) => {
    const at = lastAt.get(head);
    const best = bestE1rm.get(head);
    return {
      head,
      daysSince: at == null ? null : Math.floor((now - at) / (24 * MS_PER_HOUR)),
      bestE1rmKg: best == null ? null : Math.round(best * 10) / 10,
    };
  });
};
