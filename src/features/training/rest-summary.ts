import type { PlannedSlot } from '@/db/schema';

/** What the user does after this rest, for the notification body and the banner. */
export type NextSet =
  | {
      kind: 'same' | 'next';
      slotId: string;
      exerciseId: string;
      exerciseName: string;
      setNumber: number;
      setTotal: number;
      /** Planned rep target for that set ("8" or "8-12"). */
      reps: string;
    }
  | { kind: 'done' };

export const plannedSets = (slot: PlannedSlot) => slot.setGroups.reduce((n, g) => n + g.sets, 0);

/**
 * How many of a slot's planned rows are settled: logged sets plus skipped
 * ones, or every row once the whole exercise is skipped. Paging, the progress
 * bar and the finish guard all read this, so a skip moves the session on
 * exactly like a logged set does.
 */
export const resolvedSets = (slot: PlannedSlot, done: number): number =>
  slot.skipped ? plannedSets(slot) : done + (slot.skippedSets?.length ?? 0);

/** Planned rows still neither logged nor skipped, across the session. */
export const remainingSets = (
  planned: readonly PlannedSlot[],
  doneFor: (exerciseId: string) => number,
): number =>
  planned.reduce(
    (sum, slot) =>
      sum + Math.max(0, plannedSets(slot) - resolvedSets(slot, doneFor(slot.exerciseId))),
    0,
  );

const repsForSet = (slot: PlannedSlot, setIndex: number): string => {
  let i = setIndex;
  for (const g of slot.setGroups) {
    if (i < g.sets) return g.repsMax ? `${g.reps}-${g.repsMax}` : `${g.reps}`;
    i -= g.sets;
  }
  const last = slot.setGroups[slot.setGroups.length - 1];
  return last ? (last.repsMax ? `${last.reps}-${last.repsMax}` : `${last.reps}`) : '';
};

/**
 * Next set after a rest: the same exercise while it has planned sets left, then
 * the next exercise (in snapshot order, wrapping) with sets left, else done.
 * `doneInCurrent` includes the set just logged; `doneFor` reads the others and
 * must count WORKING sets only — a warm-up counted here skips a planned set.
 * Skipped sets and skipped exercises count as settled (`resolvedSets`).
 */
export const nextSetSummary = (
  planned: PlannedSlot[],
  currentSlotId: string,
  doneInCurrent: number,
  doneFor: (exerciseId: string) => number,
): NextSet => {
  const index = planned.findIndex((p) => p.slotId === currentSlotId);
  const current = planned[index];
  if (current) {
    const total = plannedSets(current);
    const settled = resolvedSets(current, doneInCurrent);
    if (settled < total) {
      return {
        kind: 'same',
        slotId: current.slotId,
        exerciseId: current.exerciseId,
        exerciseName: current.name,
        setNumber: settled + 1,
        setTotal: total,
        reps: repsForSet(current, settled),
      };
    }
  }
  const order = [...planned.slice(index + 1), ...planned.slice(0, Math.max(index, 0))];
  for (const slot of order) {
    const total = plannedSets(slot);
    const settled = resolvedSets(slot, doneFor(slot.exerciseId));
    if (settled < total) {
      return {
        kind: 'next',
        slotId: slot.slotId,
        exerciseId: slot.exerciseId,
        exerciseName: slot.name,
        setNumber: settled + 1,
        setTotal: total,
        reps: repsForSet(slot, settled),
      };
    }
  }
  return { kind: 'done' };
};
