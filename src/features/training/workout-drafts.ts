import { useCallback, useSyncExternalStore } from 'react';

import type { LoadDetail } from '@/db/schema';

import { setRows } from './set-rows';

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

/** `${slotId}:${rowKey}` — rowKey is `live` (the row being filled) or `edit:<setId>` (a correction). */
export type DraftKey = string;

/**
 * The live row's store key: ONE per slot, never its ordinal. A deleted set or
 * a restored skip moves the row to another ordinal, and keyed by ordinal it
 * re-seeded from the prefill there (set 1 from the previous session) while
 * what was typed sat orphaned under the old ordinal, to resurface once the
 * row reached it again.
 */
export const liveDraftKey = (slotId: string): DraftKey => `${slotId}:live`;

/** A logged set reopened for a correction. */
export const editDraftKey = (slotId: string, setId: string): DraftKey => `${slotId}:edit:${setId}`;

/** Rows beyond the plan the lifter opened on a slot (extra sets). */
export type SlotCounts = { extra: number };

type SessionDrafts = {
  rows: ReadonlyMap<DraftKey, RowDraft>;
  counts: ReadonlyMap<string, SlotCounts>;
  /** The exercise page the lifter was on; the screen reopens there. */
  focusSlotId?: string;
};

const EMPTY: SessionDrafts = { rows: new Map(), counts: new Map() };
const NO_COUNTS: SlotCounts = { extra: 0 };

/**
 * Session drafts live outside React: paging to another exercise unmounts the
 * card, leaving training mode unmounts the whole screen, and both
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

/**
 * What the live row holds once a logged set is deleted from its correction.
 * When the live row steps back onto the deleted set's place — it was the
 * exercise's LAST working set and a row stays open there (`setRows`, the rule
 * the card draws by) — it takes what the correction held: weight, reps,
 * per-side text and picture, but not the effort (a redo is a new performance,
 * so the RIR is asked again). Deleting an earlier set leaves the live row as
 * it is (null). The lifter's own numbers, never a prefill.
 */
export const liveAfterDelete = (input: {
  /** The exercise's working sets this session, in order, before the delete. */
  workingIds: readonly string[];
  deletedId: string;
  /** The correction's draft as it stands (the logged values when untouched). */
  edit: RowDraft;
  /** Planned rows, the ordinals skipped, extra rows open. */
  plannedRows: number;
  skipped: ReadonlySet<number>;
  extraRows: number;
}): RowDraft | null => {
  const { workingIds, deletedId, edit, plannedRows, skipped, extraRows } = input;
  const rows = { planned: plannedRows, skipped, extra: extraRows };
  const place = setRows({ ...rows, working: workingIds }).model.find(
    (r) => r.logged === deletedId,
  )?.i;
  const after = setRows({ ...rows, working: workingIds.filter((id) => id !== deletedId) });
  return place != null && after.live === place ? { ...edit, effort: null } : null;
};

/**
 * A set deleted from its correction: the correction's draft goes and, when
 * `liveAfterDelete` says so, the live row takes its values — one write, so no
 * render sees the one without the other.
 */
export const settleDeletedSet = (
  logId: string,
  editKey: DraftKey,
  live: { key: DraftKey; draft: RowDraft } | null,
): void => {
  const session = read(logId);
  if (!live && !session.rows.has(editKey)) return;
  const rows = new Map(session.rows);
  rows.delete(editKey);
  if (live) rows.set(live.key, live.draft);
  setSession(logId, { ...session, rows });
};

export const writeSlotCounts = (logId: string, slotId: string, counts: SlotCounts): void => {
  const next = new Map(read(logId).counts);
  next.set(slotId, counts);
  setSession(logId, { ...read(logId), counts: next });
};

/**
 * Remember which exercise page is open: leaving training mode unmounts the
 * screen, and coming back must land on the same exercise, not on the first.
 * A read-only write (same slot) emits nothing.
 */
export const writeFocusSlot = (logId: string, slotId: string): void => {
  const session = read(logId);
  if (session.focusSlotId === slotId) return;
  setSession(logId, { ...session, focusSlotId: slotId });
};

export const readFocusSlot = (logId: string): string | null => read(logId).focusSlotId ?? null;

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
