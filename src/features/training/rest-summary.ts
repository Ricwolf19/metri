import type { PlannedSlot } from '@/db/schema';

/** What the user does after this rest, for the notification body and the banner. */
export type NextSet =
  | {
      kind: 'same' | 'next';
      exerciseName: string;
      setNumber: number;
      setTotal: number;
      /** Planned rep target for that set ("8" or "8-12"). */
      reps: string;
    }
  | { kind: 'done' };

const plannedSets = (slot: PlannedSlot) => slot.setGroups.reduce((n, g) => n + g.sets, 0);

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
 * `doneInCurrent` includes the set just logged; `doneFor` reads the others.
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
    if (doneInCurrent < total) {
      return {
        kind: 'same',
        exerciseName: current.name,
        setNumber: doneInCurrent + 1,
        setTotal: total,
        reps: repsForSet(current, doneInCurrent),
      };
    }
  }
  const order = [...planned.slice(index + 1), ...planned.slice(0, Math.max(index, 0))];
  for (const slot of order) {
    const total = plannedSets(slot);
    const done = doneFor(slot.exerciseId);
    if (done < total) {
      return {
        kind: 'next',
        exerciseName: slot.name,
        setNumber: done + 1,
        setTotal: total,
        reps: repsForSet(slot, done),
      };
    }
  }
  return { kind: 'done' };
};
