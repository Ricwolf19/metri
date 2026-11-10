import type { Exercise } from '@/db/schema';

import { DEFAULT_REST } from './slot-draft';

const REST_HEAVY = 180;

/** A back exercise that hinges (deadlift) rests as a main lift, unlike a row or a pull-down. */
const HINGE_HEADS = new Set(['glutes', 'hamstrings']);

/**
 * How long an exercise rests when the lifter has set nothing for it — the two
 * bands the presets prescribe (the sheets say 2 to 3 minutes between sets, on
 * everything: 3 on the main lifts), read from what the exercise trains. An
 * exercise swapped onto a slot rests at this, not at the rest of the movement
 * it replaced: a deadlift on a back-extension slot kept that slot's 90 s.
 */
export const defaultRestFor = (
  exercise: Pick<Exercise, 'category' | 'primaryMuscles' | 'secondaryMuscles'>,
): number => {
  const primary = exercise.primaryMuscles ?? [];
  const secondary = exercise.secondaryMuscles ?? [];
  if (exercise.category === 'back') {
    return primary.some((head) => HINGE_HEADS.has(head)) ? REST_HEAVY : DEFAULT_REST;
  }
  // A close-grip press still counts as an arm exercise; a curl with a forearm helper does not lift heavy.
  return secondary.length >= (exercise.category === 'arms' ? 2 : 1) ? REST_HEAVY : DEFAULT_REST;
};
