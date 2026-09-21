import { useMMKVString } from 'react-native-mmkv';

import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

/** Copy frozen at rest start so a headless "+30 s" can redraw the notification without i18n. */
type RestCopy = {
  restingTitle: string;
  restingBody: string;
  overTitle: string;
  overBody: string;
  skipLabel: string;
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
