import { useMMKVString } from 'react-native-mmkv';

import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

/**
 * Copy frozen at rest start so a headless "+30 s" can redraw the notification
 * without i18n. The next-set lines come from the session record; this is only
 * what the rest itself adds.
 */
type RestCopy = {
  restingTitle: string;
  overTitle: string;
  skipLabel: string;
  /** The Skip action once the rest is over ("Ready"); falls back to `skipLabel`. */
  readyLabel?: string;
  plus30Label: string;
  plus60Label: string;
};

/** The one in-flight rest, or nothing. Survives leaving the screen and the process. */
export type ActiveRest = {
  workoutId: string;
  slotId: string;
  startedAt: number;
  endsAt: number;
  copy: RestCopy;
};

/**
 * Where the rest ends after shifting it by `seconds` (negative shortens it). A
 * rest that already ended restarts from `now`, so "+30 s" on a ringing alarm
 * always buys 30 s. Returns null when the shift lands at or before `now`: the
 * rest is over and the caller ends it rather than ringing the lifter's own tap.
 */
export const shiftRestEnd = (endsAt: number, now: number, seconds: number): number | null => {
  const next = Math.max(endsAt, now) + seconds * 1000;
  return next > now ? next : null;
};

const parse = (raw: string | undefined): ActiveRest | null =>
  parseJson<ActiveRest | null>(raw, null);

export const restState = {
  get(): ActiveRest | null {
    return parse(storage.getString(SettingKeys.activeRest));
  },
  set(rest: ActiveRest) {
    storage.set(SettingKeys.activeRest, JSON.stringify(rest));
  },
  clear() {
    storage.remove(SettingKeys.activeRest);
  },
};

/** Reactive view of the active rest (MMKV hook). */
export const useActiveRest = (): ActiveRest | null => {
  const [raw] = useMMKVString(SettingKeys.activeRest, storage);
  return parse(raw);
};
