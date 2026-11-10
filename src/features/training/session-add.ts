import type { PlannedSlot, SetGroup } from '@/db/schema';
import type { Locale } from '@/i18n';
import { randomId } from '@/lib/crypto';

import { addSlot } from './authoring.repo';
import { getExerciseSetting, slotSeed } from './exercise-settings.repo';
import { getExercise } from './exercises.repo';
import { exerciseDisplayName } from './labels';
import {
  appendSnapshotSlot,
  exerciseRestSeconds,
  getWorkout,
  plannedSlotFor,
} from './session.repo';

/**
 * A day's prescription for an exercise outside the plan: ONE set. More are the
 * lifter's call (the card's "Extra set"), never a plan they then have to skip.
 */
const ADDED_SETS: SetGroup[] = [{ sets: 1, reps: 8, rirMin: 2, rirMax: 2 }];

/**
 * An exercise added to a live session — a gym without the machine, a short
 * day that trades two exercises for one. Today only, the snapshot gains a slot
 * of its own (`added`, an id no plan row carries), seeded from the lifter's
 * defaults for the exercise. Kept, the enrolled split gains a real slot first
 * (`addSlot`, editable later like any other) and the snapshot points at it, so
 * the next session of the split opens with it — today it is still the one set.
 * Templates are never touched: a session only ever runs on an enrolled copy.
 */
export const addSessionExercise = (input: {
  logId: string;
  userId: string;
  exerciseId: string;
  keep: boolean;
  locale: Locale;
}): PlannedSlot | null => {
  const { logId, userId, exerciseId, keep, locale } = input;
  const log = getWorkout(logId);
  const exercise = getExercise(exerciseId);
  if (!log || log.status !== 'in_progress' || !exercise) return null;
  const added = { at: Date.now() };
  const restSeconds = exerciseRestSeconds(userId, exerciseId);
  if (keep) {
    const slot = addSlot(log.workoutDayId, log.userProgramId, exerciseId, restSeconds);
    const planned = plannedSlotFor(slot.id, log.weekNumber, locale);
    if (planned) {
      const entry = { ...planned, setGroups: ADDED_SETS, added };
      appendSnapshotSlot(logId, entry);
      return entry;
    }
  }
  const seed = slotSeed(getExerciseSetting(userId, exerciseId));
  const entry: PlannedSlot = {
    slotId: randomId(),
    exerciseId,
    name: exerciseDisplayName(exercise, locale),
    setGroups: ADDED_SETS,
    restSeconds,
    badges: seed.badges ?? [],
    alternativeExerciseIds: seed.alternativeExerciseIds ?? [],
    notes: null,
    added,
  };
  appendSnapshotSlot(logId, entry);
  return entry;
};
