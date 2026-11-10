import type { PlannedSlot } from '@/db/schema';

import { nextSetSummary, plannedSets, resolvedSets, type NextSet } from './rest-summary';

/**
 * Where an exercise of the live session stands, as the chip strip paints it:
 * nothing settled yet, done (every planned set logged), missed (nothing
 * logged and the exercise or every one of its sets skipped), or partial —
 * anything in between, including an exercise skipped after a logged set.
 */
export type SlotState = 'untouched' | 'partial' | 'done' | 'missed';

/** `done` = WORKING sets logged for the slot's exercise. */
export const slotState = (slot: PlannedSlot, done: number): SlotState => {
  const total = plannedSets(slot);
  const skipped = slot.skippedSets?.length ?? 0;
  if (slot.skipped) return done > 0 ? 'partial' : 'missed';
  if (done === 0) {
    if (skipped === 0) return 'untouched';
    return skipped >= total ? 'missed' : 'partial';
  }
  return done >= total ? 'done' : 'partial';
};

export type SessionOrder = {
  /** Everything with at least one set logged, or still to do — in snapshot order. */
  active: PlannedSlot[];
  /** Missed outright: drawn after a divider at the end of the strip. */
  missed: PlannedSlot[];
};

/**
 * The strip's order: a missed exercise drops to the end behind a divider, and
 * everything else keeps its place. Display only — the snapshot keeps the
 * missed slot where it was, so restoring it puts it straight back.
 */
export const sessionOrder = (
  planned: readonly PlannedSlot[],
  doneFor: (exerciseId: string) => number,
): SessionOrder => {
  const active: PlannedSlot[] = [];
  const missed: PlannedSlot[] = [];
  for (const slot of planned) {
    (slotState(slot, doneFor(slot.exerciseId)) === 'missed' ? missed : active).push(slot);
  }
  return { active, missed };
};

/**
 * A new active order written back into the snapshot: the missed slots hold
 * their positions and the active ones fill the rest in their new order. Every
 * reorder goes through here, so a missed exercise is never dragged along.
 */
export const mergeOrder = (
  snapshotIds: readonly string[],
  missedIds: ReadonlySet<string>,
  activeIds: readonly string[],
): string[] => {
  let k = 0;
  return snapshotIds.map((id) => (missedIds.has(id) ? id : (activeIds[k++] ?? id)));
};

/**
 * An exercise under way with planned sets still open, other than `slotId`
 * (null: any). It has to be finished or marked missed before a set goes on
 * another one, which is what lets a session close without asking about open rows.
 */
export const pendingElsewhere = (
  planned: readonly PlannedSlot[],
  slotId: string | null,
  doneFor: (exerciseId: string) => number,
): { slot: PlannedSlot; open: number } | null => {
  // Sets are counted per exercise: two grips of one exercise (a preset's narrow
  // and wide pull-down) share their count, and never hold each other up.
  const logging = planned.find((p) => p.slotId === slotId)?.exerciseId;
  for (const slot of planned) {
    if (slot.slotId === slotId || slot.exerciseId === logging) continue;
    const done = doneFor(slot.exerciseId);
    const open = plannedSets(slot) - resolvedSets(slot, done);
    if (open > 0 && slotState(slot, done) === 'partial') return { slot, open };
  }
  return null;
};

/**
 * The set the session is heading for, as the notification names it: the
 * exercise under way, else the first with sets open in the CURRENT order — so
 * a reorder changes it. A pure read of the session, never of the last answer.
 */
export const sessionNext = (
  planned: PlannedSlot[],
  doneFor: (exerciseId: string) => number,
): NextSet => {
  const begun = pendingElsewhere(planned, null, doneFor)?.slot;
  return begun
    ? nextSetSummary(planned, begun.slotId, doneFor(begun.exerciseId), doneFor)
    : nextSetSummary(planned, '', 0, doneFor);
};

/**
 * Sessions are recorded in the order they happen. The first set of an
 * exercise that has not begun, while an earlier one has not begun either,
 * moves it up to be the next one: it lands just before the first untouched
 * exercise ahead of it. Returns the new ACTIVE order, or null when nothing
 * has to move (the exercise is already under way, or everything before it is).
 */
export const chronologyMove = (
  active: readonly PlannedSlot[],
  slotId: string,
  doneFor: (exerciseId: string) => number,
): string[] | null => {
  const at = active.findIndex((p) => p.slotId === slotId);
  const slot = active[at];
  if (!slot || slotState(slot, doneFor(slot.exerciseId)) !== 'untouched') return null;
  const target = active.findIndex(
    (p, i) => i < at && slotState(p, doneFor(p.exerciseId)) === 'untouched',
  );
  if (target < 0) return null;
  const ids = active.map((p) => p.slotId);
  ids.splice(at, 1);
  ids.splice(target, 0, slotId);
  return ids;
};
