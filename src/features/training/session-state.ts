import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

/**
 * The next planned set, as copy. Frozen at write time because the training
 * notification is redrawn headlessly (a Skip from the shade, the service's
 * "rest over") where there is no i18n, no unit setting and no React tree.
 */
export type NextSetCopy = {
  /** Deep link target: the card to focus when the notification is tapped. */
  slotId: string;
  exerciseName: string;
  /** e.g. "Set 3/4". */
  setLabel: string;
  /** e.g. "Top set · Target: 6–8 reps @ RIR 1"; empty beyond the plan. */
  targetLabel: string;
  /** The load the row will be prefilled with, in the lifter's unit; empty with no history. */
  weightLabel: string;
};

/**
 * The in-flight workout session, or nothing. MMKV rather than a DB read so the
 * headless notification paths and the check-in hold can ask "is a session
 * on?" without the React tree. Copy is frozen at write time (like the rest
 * copy): a headless redraw has no i18n.
 */
export type ActiveSession = {
  workoutId: string;
  startedAt: number;
  title: string;
  /**
   * What comes next; null once every planned set is done. Absent on a record
   * written by a build before the merged notification — the redraw then shows
   * the title and the clock only, never throws.
   */
  next?: NextSetCopy | null;
  /** "All planned sets done", shown in place of `next` once it is null. */
  doneLabel?: string;
};

/** A session left open longer than this is abandoned in all but name: it no
 * longer holds the check-in back. */
export const SESSION_STALE_MS = 4 * 60 * 60 * 1000;

export const sessionState = {
  get(): ActiveSession | null {
    return parseJson<ActiveSession | null>(storage.getString(SettingKeys.activeSession), null);
  },
  set(session: ActiveSession) {
    storage.set(SettingKeys.activeSession, JSON.stringify(session));
  },
  clear() {
    storage.remove(SettingKeys.activeSession);
  },
};

export const isSessionInProgress = (now = Date.now()): boolean => {
  const session = sessionState.get();
  return session !== null && now - session.startedAt < SESSION_STALE_MS;
};
