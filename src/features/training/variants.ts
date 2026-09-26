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
  ['barbell-bench-press', 'machine-chest-press'],
  ['dumbbell-fly', 'cable-fly'],
  ['lateral-raise', 'cable-lateral-raise'],
  ['machine-row', 'dumbbell-row', 'seated-cable-row', 't-bar-row'],
  ['barbell-back-squat', 'hack-squat', 'leg-press'],
  ['lying-leg-curl', 'standing-leg-curl'],
  ['crunch', 'cable-crunch'],
  ['overhead-tricep-extension', 'cable-overhead-extension', 'french-press'],
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
