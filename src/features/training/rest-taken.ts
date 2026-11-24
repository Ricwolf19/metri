import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

import { restState, type ActiveRest } from './rest-state';
import { SESSION_IDLE_CAP_MS } from './session-end';

/**
 * The rest the lifter actually took — the one measured input of the session's
 * time breakdown (`session-timing.ts`). A rest ends at Ready or Skip (on screen
 * or from the notification) or at a −30 s past zero, every one of them through
 * `endRest`, which may run HEADLESS: so the end is written to MMKV there, read
 * and spent when the next set is logged (`set_logs.rest_before_seconds`), and
 * cleared when the session closes. Ready says the rest is over, not that the
 * set began — the breakdown treats it as an estimate for that reason.
 */
export type TakenRest = { workoutId: string; startedAt: number; endedAt: number };

/** Past the idle cap a rest is idle time, not rest: a recorded rest stops there. */
export const MAX_REST_SECONDS = SESSION_IDLE_CAP_MS / 1000;

const isTakenRest = (v: unknown): v is TakenRest =>
  !!v &&
  typeof v === 'object' &&
  typeof (v as TakenRest).workoutId === 'string' &&
  Number.isFinite((v as TakenRest).startedAt) &&
  Number.isFinite((v as TakenRest).endedAt);

export const restTaken = {
  get(): TakenRest | null {
    const value = parseJson<unknown>(storage.getString(SettingKeys.restTaken), null);
    return isTakenRest(value) ? value : null;
  },
  set(rest: TakenRest) {
    storage.set(SettingKeys.restTaken, JSON.stringify(rest));
  },
  clear() {
    storage.remove(SettingKeys.restTaken);
  },
};

const clampSeconds = (ms: number): number =>
  Math.min(MAX_REST_SECONDS, Math.max(0, Math.round(ms / 1000)));

/**
 * The rest before a set logged `now`, in seconds: the rest that began after the
 * previous set, from its start to the lifter's Ready — or, never ended, to this
 * set. Null when no rest of this workout ran (the first set, a set after a skip).
 * A rest still running began after the newest set, so it wins over an older end.
 */
export const restBeforeSet = ({
  workoutId,
  taken,
  running,
  now,
}: {
  workoutId: string;
  taken: TakenRest | null;
  running: Pick<ActiveRest, 'workoutId' | 'startedAt'> | null;
  now: number;
}): number | null => {
  const ended = taken?.workoutId === workoutId ? taken : null;
  const live = running?.workoutId === workoutId ? running : null;
  if (live && (!ended || live.startedAt >= ended.startedAt))
    return clampSeconds(now - live.startedAt);
  if (ended) return clampSeconds(ended.endedAt - ended.startedAt);
  return null;
};

/** `restBeforeSet` for the set being logged right now; the ended record is spent by it. */
export const takeRestBefore = (workoutId: string, now = Date.now()): number | null => {
  const taken = restTaken.get();
  const seconds = restBeforeSet({ workoutId, taken, running: restState.get(), now });
  if (taken) restTaken.clear();
  return seconds;
};
