import { endRest, endSession } from '@/features/notifications/rest-notification';

import { syncTrainingReminder } from './reminders';
import { abandonWorkout, finishWorkout } from './session.repo';
import { clearSessionDrafts } from './workout-drafts';

type SessionOutcome = 'finish' | 'abandon';

/**
 * The one teardown for an in-progress session, shared by the workout screen and
 * the stale-session dialog. Hand-copied, the dialog skipped the drafts, the
 * rest and the reminder, so half-typed sets resurfaced in the next run of the
 * day and a stale rest kept ringing. Sound and navigation stay with the caller.
 */
export const closeSession = (outcome: SessionOutcome, logId: string, userId: string): void => {
  if (outcome === 'finish') finishWorkout(logId);
  else abandonWorkout(logId);
  void endRest();
  clearSessionDrafts(logId);
  void endSession();
  // Finishing advances the program, so the next reminder may point at another
  // day; an abandoned session leaves the position (and the schedule) as it was.
  if (outcome === 'finish') void syncTrainingReminder(userId);
};
