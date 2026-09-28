import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

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
  exerciseName: string;
  /** e.g. "Set 2/4" — the set just logged; empty before the first one. */
  setLabel: string;
  /** Next target (exercise + set + reps); empty once every set is done. */
  nextLabel: string;
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
