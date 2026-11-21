import type { Exercise } from '@/db/schema';

import { CATALOG_REST_SECONDS } from './catalog-rest';
import { DEFAULT_REST } from './slot-draft';

const REST_HEAVY = 180;

/** A back exercise that hinges (deadlift) rests as a main lift, unlike a row or a pull-down. */
const HINGE_HEADS = new Set(['glutes', 'hamstrings']);

/**
 * The two bands every exercise rested at before the catalog table (the rest
 * the presets prescribe — their sheets say 2 to 3 minutes between sets, on
 * everything: 3 on the main lifts), read from what the exercise trains. A
 * custom exercise still rests by it; for a catalog one it is what slots
 * seeded by those builds hold (a curl at 120 where the table says 75, a
 * deadlift at 180 where it says 210), so settings propagation reads that value
 * as untouched too.
 */
export const legacyRestFor = (
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

/**
 * How long an exercise rests when the lifter has set nothing for it. A catalog
 * exercise rests at its own entry in `CATALOG_REST_SECONDS` (graded by the
 * muscle and joints it loads); anything else — a custom exercise, an id the
 * catalog dropped — falls back to `legacyRestFor`. The presets keep their own
 * prescriptions and never read this. An exercise swapped onto a slot rests at
 * this, not at the rest of the movement it replaced: a deadlift on a
 * back-extension slot kept that slot's 90 s.
 */
export const defaultRestFor = (
  exercise: Pick<Exercise, 'id' | 'category' | 'primaryMuscles' | 'secondaryMuscles'>,
): number =>
  Object.hasOwn(CATALOG_REST_SECONDS, exercise.id)
    ? CATALOG_REST_SECONDS[exercise.id]
    : legacyRestFor(exercise);
