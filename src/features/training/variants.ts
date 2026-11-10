import type { Exercise, PlannedSlot } from '@/db/schema';

import { exerciseHeads, knownHeads, type MuscleHead } from './muscles';

/**
 * Equipment variants: the same movement pattern on different kit, so a taken
 * rack or machine never blocks the session (F3). Catalog ids only; a slot's
 * own `alternativeExerciseIds` still come first. Each variant is its own
 * exercise, which is what keeps the log honest: the set is recorded against
 * the variant actually done, history names it, and prefill never crosses from
 * one variant's loads to another's.
 */
const FAMILIES: readonly (readonly string[])[] = [
  ['overhead-press', 'seated-barbell-press', 'seated-dumbbell-press', 'machine-shoulder-press'],
  [
    'barbell-bench-press',
    'dumbbell-bench-press',
    'smith-machine-bench-press',
    'machine-chest-press',
  ],
  ['incline-bench-press', 'incline-dumbbell-press'],
  ['dumbbell-fly', 'cable-fly', 'machine-fly'],
  ['rear-delt-fly', 'machine-rear-delt-fly'],
  ['lateral-raise', 'cable-lateral-raise', 'machine-lateral-raise'],
  [
    'machine-row',
    'dumbbell-row',
    'seated-cable-row',
    't-bar-row',
    'barbell-row',
    'chest-supported-row',
  ],
  // The grips are separate exercises (their loads never cross), but on one
  // machine and one pattern they are each other's first swap.
  [
    'lat-pulldown',
    'supinated-lat-pulldown',
    'close-grip-lat-pulldown',
    'wide-grip-lat-pulldown',
    'pull-up',
    'assisted-pull-up',
  ],
  ['pullover', 'cable-pullover'],
  ['barbell-back-squat', 'goblet-squat', 'smith-machine-squat', 'hack-squat', 'leg-press'],
  // One leg at a time: a lunge family rather than a squat variant, so the
  // per-side log and the dumbbell-per-hand entry stay among their own kind.
  ['bulgarian-split-squat', 'walking-lunge', 'reverse-lunge'],
  ['romanian-deadlift', 'dumbbell-romanian-deadlift'],
  ['lying-leg-curl', 'standing-leg-curl'],
  ['standing-calf-raise', 'seated-calf-raise', 'single-leg-calf-raise'],
  ['crunch', 'cable-crunch', 'decline-sit-up', 'machine-crunch'],
  // Supinated curls only: the hammer curl is a different grip, not different kit.
  [
    'barbell-curl',
    'dumbbell-curl',
    'cable-curl',
    'preacher-curl',
    'machine-preacher-curl',
    'spider-curl',
    'barbell-spider-curl',
    'incline-dumbbell-curl',
  ],
  ['hammer-curl', 'cable-hammer-curl'],
  // Overhead ("tras nuca") and lying ("press francés") are different movements,
  // not different kit: two families, each with its own implements.
  ['overhead-tricep-extension', 'cable-overhead-extension', 'french-press'],
  ['skullcrusher', 'barbell-skullcrusher'],
  ['cable-kickback', 'dumbbell-kickback'],
];

const FAMILY_OF: ReadonlyMap<string, readonly string[]> = new Map(
  FAMILIES.flatMap((family) => family.map((id) => [id, family] as const)),
);

/** Other-equipment versions of an exercise (empty for customs and one-offs). */
export const equipmentVariants = (exerciseId: string): string[] =>
  (FAMILY_OF.get(exerciseId) ?? []).filter((id) => id !== exerciseId);

/**
 * What a slot can be swapped to mid-session: the planned exercise (to swap
 * back), the slot's alternatives, then equipment variants of both — minus
 * whatever is on the card right now.
 */
export const swapOptions = (
  planned: Pick<PlannedSlot, 'exerciseId' | 'alternativeExerciseIds' | 'originalExerciseId'>,
): string[] => {
  const original = planned.originalExerciseId ?? planned.exerciseId;
  const ordered = [
    original,
    ...planned.alternativeExerciseIds,
    ...equipmentVariants(original),
    ...equipmentVariants(planned.exerciseId),
  ];
  return [...new Set(ordered)].filter((id) => id !== planned.exerciseId);
};

/**
 * Identity of a session's prefill sources: which exercise each slot is on.
 * Last week's loads are looked up per exercise, so a swap must change this
 * key — memoising on the session id alone kept serving the swapped-out
 * exercise's weights to its variant.
 */
export const prefillSourceKey = (snapshot: readonly Pick<PlannedSlot, 'slotId' | 'exerciseId'>[]) =>
  snapshot.map((p) => `${p.slotId}:${p.exerciseId}`).join('|');

type Ranked = Pick<Exercise, 'id' | 'primaryMuscles' | 'secondaryMuscles' | 'category'>;

/**
 * Heads that are one muscle seen from two angles — a flat press still trains
 * the upper chest, a pulldown the mid back. Not the category: "arms" holds
 * biceps and triceps, and a curl is no stand-in for a pushdown.
 */
const SIBLING_HEADS: readonly (readonly MuscleHead[])[] = [
  ['chest', 'upper_chest'],
  ['lats', 'mid_back'],
  ['abs', 'obliques'],
  ['quads', 'adductors'],
  ['hamstrings', 'glutes'],
];
const SIBLINGS_OF: ReadonlyMap<MuscleHead, readonly MuscleHead[]> = new Map(
  SIBLING_HEADS.flatMap((group) =>
    group.map((h) => [h, group.filter((other) => other !== h)] as const),
  ),
);

/**
 * A bigger replacement than a variant: other movements for the same muscles,
 * for the day a whole family is out of reach (no rack, no machines). Ranked by
 * how much of the target's work they cover: each primary head the candidate
 * also trains as primary counts most, a sibling head (upper chest for chest,
 * `SIBLING_HEADS`) a little less, and one of the two is required. Capped, because past
 * a handful the list stops being a suggestion. Variants come first in the sheet: they keep the
 * plan's movement; these keep only its muscles.
 */
export const similarExercises = <T extends Ranked>(
  target: Ranked,
  pool: readonly T[],
  exclude: ReadonlySet<string>,
  limit = 8,
): T[] => {
  const primary = exerciseHeads(target);
  const secondary = knownHeads(target.secondaryMuscles);
  const family = new Set([target.id, ...equipmentVariants(target.id)]);
  const scored: { exercise: T; score: number; index: number }[] = [];
  pool.forEach((exercise, index) => {
    if (family.has(exercise.id) || exclude.has(exercise.id)) return;
    const theirs = exerciseHeads(exercise);
    const theirSecondary = knownHeads(exercise.secondaryMuscles);
    const covered = primary.reduce(
      (sum, h) =>
        sum +
        (theirs.includes(h)
          ? 3
          : (SIBLINGS_OF.get(h) ?? []).some((sib) => theirs.includes(sib))
            ? 2
            : 0),
      0,
    );
    if (!covered) return;
    const score =
      covered +
      primary.filter((h) => theirSecondary.includes(h)).length +
      secondary.filter((h) => theirs.includes(h)).length +
      (exercise.category === target.category ? 1 : 0);
    scored.push({ exercise, score, index });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((s) => s.exercise);
};
