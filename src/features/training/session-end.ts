import type { WorkoutLog } from '@/db/schema';

import { localDateKey } from './dates';

/**
 * When a session ends, as the record keeps it — the last thing the lifter did,
 * not the moment someone tapped "finish". A session left open over lunch (or
 * overnight, then saved from the stale prompt) used to count every hour of it.
 */

/**
 * Past this long with nothing logged, an open session is over: it ends at its
 * last activity (the last set, else its start). Under it, the finish tap is
 * the end — a cool-down or a last stretch before closing is part of it.
 */
export const SESSION_IDLE_CAP_MS = 30 * 60 * 1000;

/**
 * The moment a session ends. `lastActivityAt` is its newest logged set (null
 * when nothing was logged). A REOPENED session (`firstFinishedAt` set) was
 * already over once: only a set logged since moves its end, so reading the
 * summary and tapping "Back to session" never adds minutes to it.
 */
export const sessionEndAt = ({
  startedAt,
  lastActivityAt,
  now,
  firstFinishedAt = null,
}: {
  startedAt: number;
  lastActivityAt: number | null;
  now: number;
  firstFinishedAt?: number | null;
}): number => {
  const last = Math.max(startedAt, lastActivityAt ?? startedAt);
  if (firstFinishedAt != null) return Math.max(last, firstFinishedAt);
  if (now - last > SESSION_IDLE_CAP_MS) return last;
  return Math.max(now, startedAt);
};

/**
 * How a finished session is filed: its `completedAt` and the day it marks
 * trained. A reopened session stays on the day it was first finished — reopened
 * after midnight to add a set, it must not move to the next day (the day sheet
 * lists sessions by `completedAt`, and the mark has to match it).
 */
export const sessionFiling = ({
  endAt,
  firstFinishedAt,
}: {
  endAt: number;
  firstFinishedAt: number | null;
}): { completedAt: number; day: string } => {
  if (firstFinishedAt == null) return { completedAt: endAt, day: localDateKey(new Date(endAt)) };
  const day = localDateKey(new Date(firstFinishedAt));
  return { completedAt: localDateKey(new Date(endAt)) === day ? endAt : firstFinishedAt, day };
};

/**
 * A session finished once and opened again from its summary ("Back to
 * session"): in progress, with the `completedAt` of the first finish kept as
 * the marker. It can be finished again, never abandoned — abandoning deletes
 * every set, and these were a complete session.
 */
export const isReopened = (log: Pick<WorkoutLog, 'status' | 'completedAt'>): boolean =>
  log.status === 'in_progress' && log.completedAt != null;

/**
 * A session's length as the record holds it: the one it was saved with, else
 * — an imported row may carry none — from its own end, else (still open) up
 * to `now`. ONE rule for the summary and the share card: with `now` for a
 * closed session too, a card shared from the day sheet read hundreds of hours.
 */
export const recordedDurationSeconds = (
  log: Pick<WorkoutLog, 'startedAt' | 'completedAt' | 'durationSeconds'>,
  now: number,
): number =>
  log.durationSeconds ??
  Math.max(0, Math.round(((log.completedAt?.getTime() ?? now) - log.startedAt.getTime()) / 1000));
