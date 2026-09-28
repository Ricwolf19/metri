import { dateFromKey, localDateKey, weekdayOf } from '@/features/training/dates';
import { SESSION_STALE_MS } from '@/features/training/session-state';

import { shiftEntries, type FiringEntry } from './schedule-entries';

/**
 * The check-in anchored to the real session instead of the planned one.
 *
 * The regular check-in is a weekly OS trigger at (planned start + delay), and
 * the OS draws it with the phone locked mid-set — nothing in JS can swallow it
 * there. So the day a session starts, the reconciler holds back that day's
 * weekly entries (the "hold"), and when the session ends it asks once at
 * end + delay instead, or not at all when finishing already answered the day.
 * Every OS id involved goes through the reconciler, so the master switch and
 * the event toggle still cancel all of it.
 */

export type CheckinHold = {
  /** 'YYYY-MM-DD' the session started — whose planned check-in is held back. */
  day: string;
  /** Epoch ms of the session-anchored ask; null while the session runs or when
   * nothing needs asking. */
  askAt: number | null;
};

export type SessionEnd = {
  startedAt: number;
  endedAt: number;
  /** The event's configured delay (offsetMinutes). */
  delayMinutes: number;
  /** The session-checkin event's own toggle. */
  enabled: boolean;
  /** Notifications master switch. */
  masterEnabled: boolean;
  /** The day already has a training-day entry (finishing marks it trained). */
  dayResolved: boolean;
};

const MINUTE_MS = 60_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * What the hold becomes once the session ends; null drops it, so the regular
 * schedule answers for the day again.
 */
export const planCheckinAfterSession = ({
  startedAt,
  endedAt,
  delayMinutes,
  enabled,
  masterEnabled,
  dayResolved,
}: SessionEnd): CheckinHold | null => {
  if (!masterEnabled || !enabled) return null;
  // An orphan found at boot hours later: that session is not what the day's
  // question is about, so the planned check-in (and the catch-up) take it back.
  if (endedAt - startedAt >= SESSION_STALE_MS) return null;
  const day = localDateKey(new Date(startedAt));
  // Finished: the day is marked trained, so the planned check-in stays held
  // too — it would only ask what is already answered.
  if (dayResolved) return { day, askAt: null };
  // Epoch arithmetic, so a late session simply asks after midnight.
  return { day, askAt: endedAt + delayMinutes * MINUTE_MS };
};

export type HeldCheckinPlan =
  | { expired: true }
  | {
      expired: false;
      /** Weekly entries to schedule, already shifted by the delay. */
      weekly: FiringEntry[];
      /** One-shot asks (epoch ms), all in the future. */
      once: number[];
    };

/** Local wall time `minutes` after midnight of `day`, `plusDays` later (DST-safe). */
const atMinutes = (day: string, minutes: number, plusDays = 0): number => {
  const d = dateFromKey(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + plusDays, 0, minutes).getTime();
};

/**
 * Which check-ins the reconciler schedules while a hold stands. The held day's
 * RAW entries (by the weekday the session was planned on) leave the weekly set;
 * dropping a weekly trigger also drops next week's occurrence, so each comes
 * back as a one-shot seven days on — any reconcile after the hold expires
 * restores the weekly trigger and cancels that stand-in. The hold expires once
 * both the held entries' moment and the session-anchored ask have passed.
 */
export const planHeldCheckin = ({
  entries,
  offsetMinutes,
  hold,
  now,
}: {
  /** Raw session times (before the delay). */
  entries: readonly FiringEntry[];
  offsetMinutes: number;
  hold: CheckinHold;
  now: number;
}): HeldCheckinPlan => {
  // MMKV outlives builds: a shape this code cannot read must expire, not
  // compute NaN moments that never pass and hold the day back for good.
  if (!DAY_KEY.test(String(hold.day)) || (hold.askAt !== null && !Number.isFinite(hold.askAt)))
    return { expired: true };
  const weekday = weekdayOf(dateFromKey(hold.day));
  const held = entries.filter((e) => e.weekday === weekday);
  const kept = entries.filter((e) => e.weekday !== weekday);
  const fireAts = held.map((e) => atMinutes(hold.day, e.hour * 60 + e.minute + offsetMinutes));
  const endsAt = Math.max(hold.askAt ?? 0, ...fireAts);
  if (now >= endsAt) return { expired: true };

  const once = new Set<number>();
  if (hold.askAt !== null && hold.askAt > now) once.add(hold.askAt);
  for (const e of held) {
    const nextWeek = atMinutes(hold.day, e.hour * 60 + e.minute + offsetMinutes, 7);
    if (nextWeek > now) once.add(nextWeek);
  }
  return {
    expired: false,
    weekly: shiftEntries(kept, offsetMinutes),
    once: [...once].sort((a, b) => a - b),
  };
};
