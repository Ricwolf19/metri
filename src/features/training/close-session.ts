import { endRest, endSession } from '@/features/notifications/rest-notification';
import { captureError } from '@/lib/telemetry';

import { reconcileAutoAdherence } from './auto-adherence.repo';
import { syncTrainingReminder } from './reminders';
import { restTaken } from './rest-taken';
import { isReopened } from './session-end';
import { abandonWorkout, finishWorkout, getWorkout, markRemainingSkipped } from './session.repo';
import { clearSessionDrafts } from './workout-drafts';

type SessionOutcome = 'finish' | 'abandon';

/**
 * The one teardown for an in-progress session, shared by the workout screen and
 * the stale-session dialog. Hand-copied, the dialog skipped the drafts, the
 * rest and the reminder, so half-typed sets resurfaced in the next run of the
 * day and a stale rest kept ringing. Sound and navigation stay with the caller.
 *
 * Finishing closes whatever is still open as MISSED first, on every path (the
 * stale prompt used to leave the rows unfilled). A REOPENED session refuses to
 * be abandoned: abandoning deletes every set, and it was a complete session.
 * Returns whether the session closed; one already closed is left alone.
 */
export const closeSession = (outcome: SessionOutcome, logId: string, userId: string): boolean => {
  const log = getWorkout(logId);
  // Closed already (a second tap, the stale prompt racing the screen): nothing
  // to tear down, and no snapshot rewritten for sync to push again.
  if (!log || log.status !== 'in_progress') return false;
  if (outcome === 'finish') {
    markRemainingSkipped(logId);
    finishWorkout(logId);
  } else {
    if (isReopened(log)) return false;
    abandonWorkout(logId);
  }
  void endRest();
  // `endRest` just recorded the rest it ended; with the session over, no set will read it.
  restTaken.clear();
  clearSessionDrafts(logId);
  void endSession();
  // Finishing advances the program, so the next reminder may point at another
  // day; an abandoned session leaves the position (and the schedule) as it was.
  if (outcome === 'finish') {
    void syncTrainingReminder(userId);
    // A session on an unplanned day may make up the missed day before it.
    // Bookkeeping after the save: a throw here must not strand the finish
    // (the caller's overlay stays up until it navigates away).
    try {
      reconcileAutoAdherence(userId);
    } catch (e) {
      captureError(e);
    }
  }
  return true;
};
