import type { PlannedSlot } from '@/db/schema';

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
  ['dumbbell-fly', 'cable-fly'],
  ['lateral-raise', 'cable-lateral-raise', 'machine-lateral-raise'],
  [
    'machine-row',
    'dumbbell-row',
    'seated-cable-row',
    't-bar-row',
    'barbell-row',
    'chest-supported-row',
  ],
  ['lat-pulldown', 'pull-up', 'assisted-pull-up'],
  ['barbell-back-squat', 'goblet-squat', 'smith-machine-squat', 'hack-squat', 'leg-press'],
  // One leg at a time: a lunge family rather than a squat variant, so the
  // per-side log and the dumbbell-per-hand entry stay among their own kind.
  ['bulgarian-split-squat', 'walking-lunge', 'reverse-lunge'],
  ['romanian-deadlift', 'dumbbell-romanian-deadlift'],
  ['lying-leg-curl', 'standing-leg-curl'],
  ['standing-calf-raise', 'seated-calf-raise', 'single-leg-calf-raise'],
  ['crunch', 'cable-crunch'],
  // Supinated curls only: the hammer curl is a different grip, not different kit.
  [
    'barbell-curl',
    'dumbbell-curl',
    'cable-curl',
    'preacher-curl',
    'machine-preacher-curl',
    'spider-curl',
    'incline-dumbbell-curl',
  ],
  ['overhead-tricep-extension', 'cable-overhead-extension', 'french-press'],
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
