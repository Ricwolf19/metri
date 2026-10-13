import { useCallback, useSyncExternalStore } from 'react';

import type { LoadDetail } from '@/db/schema';

/** What the lifter reports after a set; `rir: null` = deliberately skipped. */
export type Effort = { rir: number | null; failure: boolean };

/** The in-progress inputs of one set row — strings, exactly what was typed,
 * plus how the weight was built when it came from the sheet (kg). */
export type RowDraft = {
  /** The TOTAL in the display unit — what `weight_kg` will store. */
  weight: string;
  reps: string;
  effort: Effort | null;
  load?: LoadDetail | null;
  /**
   * On a plate-loaded exercise the lifter types the weight per side and this
   * is that text; `weight` is derived from it. Absent (never typed, or the
   * base changed) it is recomputed from the total.
   */
  side?: string;
};

/** `${slotId}:${rowKey}` — rowKey is the exercise-card row (`0`, `1`, …, `w0`, …). */
export type DraftKey = string;

/** Rows beyond the plan the lifter opened on a slot (extra sets). */
export type SlotCounts = { extra: number };

type SessionDrafts = {
  rows: ReadonlyMap<DraftKey, RowDraft>;
  counts: ReadonlyMap<string, SlotCounts>;
};

const EMPTY: SessionDrafts = { rows: new Map(), counts: new Map() };
const NO_COUNTS: SlotCounts = { extra: 0 };

/**
 * Session drafts live outside React: switching exercises in compact view
 * unmounts the card, leaving training mode unmounts the whole screen, and both
 * used to throw away half-typed sets. The store is module-level (like the rest
 * timer's MMKV state), keyed by workoutLogId, and cleared when the session
 * ends. Inner maps are replaced immutably so `useSyncExternalStore` snapshots
 * change identity only when data does.
 */
const sessions = new Map<string, SessionDrafts>();
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const setSession = (logId: string, next: SessionDrafts) => {
  sessions.set(logId, next);
  emit();
};

const read = (logId: string): SessionDrafts => sessions.get(logId) ?? EMPTY;

export const writeDraft = (logId: string, key: DraftKey, draft: RowDraft): void => {
  const rows = new Map(read(logId).rows);
  rows.set(key, draft);
  setSession(logId, { ...read(logId), rows });
};

export const clearDraft = (logId: string, key: DraftKey): void => {
  const session = read(logId);
  if (!session.rows.has(key)) return;
  const rows = new Map(session.rows);
  rows.delete(key);
  setSession(logId, { ...session, rows });
};

/**
 * A slot swapped to another exercise keeps its typed rows but not how they were
 * built: a bar + plates detail logged against a dumbbell variant would lie, and
 * a per-side text split over the old variant's base no longer adds up.
 */
export const clearDraftLoads = (logId: string, slotId: string): void => {
  const session = read(logId);
  const rows = new Map(session.rows);
  let changed = false;
  for (const [key, draft] of rows) {
    if (key.startsWith(`${slotId}:`) && (draft.load || draft.side !== undefined)) {
      rows.set(key, { ...draft, load: null, side: undefined });
      changed = true;
    }
  }
  if (changed) setSession(logId, { ...session, rows });
};

export const writeSlotCounts = (logId: string, slotId: string, counts: SlotCounts): void => {
  const next = new Map(read(logId).counts);
  next.set(slotId, counts);
  setSession(logId, { ...read(logId), counts: next });
};

/** The session is over — drafts must not leak into a re-run of the same day. */
export const clearSessionDrafts = (logId: string): void => {
  if (!sessions.delete(logId)) return;
  emit();
};

/** Synchronous read (tests, non-React callers). */
export const readSessionDrafts = (logId: string): ReadonlyMap<DraftKey, RowDraft> =>
  read(logId).rows;

export const readSlotCounts = (logId: string, slotId: string): SlotCounts =>
  read(logId).counts.get(slotId) ?? NO_COUNTS;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const EMPTY_ROWS: ReadonlyMap<DraftKey, RowDraft> = new Map();

export const useSessionDrafts = (logId: string): ReadonlyMap<DraftKey, RowDraft> =>
  useSyncExternalStore(
    subscribe,
    useCallback(() => read(logId).rows, [logId]),
    () => EMPTY_ROWS,
  );

export const useSlotCounts = (logId: string, slotId: string): SlotCounts => {
  const getSnapshot = useCallback(() => readSlotCounts(logId, slotId), [logId, slotId]);
  return useSyncExternalStore(subscribe, getSnapshot, () => NO_COUNTS);
};
