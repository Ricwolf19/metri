import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { userPrograms, workoutDays } from '@/db/schema';
import { NOTIFICATION_EVENTS } from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { settings } from '@/lib/storage';

import { reminderEntries } from './schedule';

const TRAINING_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'training-time')!;
const CHECKIN_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'session-checkin')!;

/** Point the schedule-driven reminders at the active phase (one entry per scheduled split); no
 * enrollment/schedule → off. Both events store the RAW session times: the check-in applies its own
 * delay when scheduling, so changing that delay never needs the program re-read. `enable` switches
 * training time on (start flow); otherwise the user's toggle is kept. */
export const syncTrainingReminder = async (
  userId: string,
  { enable = false }: { enable?: boolean } = {},
): Promise<void> => {
  const [enrollment] = db
    .select({ currentRoutineId: userPrograms.currentRoutineId })
    .from(userPrograms)
    .where(and(eq(userPrograms.userId, userId), inArray(userPrograms.status, ['active', 'paused'])))
    .orderBy(desc(userPrograms.createdAt))
    .limit(1)
    .all();
  const days = enrollment?.currentRoutineId
    ? db
        .select()
        .from(workoutDays)
        .where(eq(workoutDays.routineId, enrollment.currentRoutineId))
        .all()
    : [];
  const schedule = reminderEntries(days);
  const current = getEventConfig(TRAINING_EVENT);
  settings.setEventConfig(TRAINING_EVENT.id, {
    ...current,
    // Only a user-initiated start switches the reminder on; a saved split or a
    // finished workout just refreshes the schedule and respects the toggle.
    enabled: schedule.length > 0 && (current.enabled || enable),
    schedule,
  });
  const checkin = getEventConfig(CHECKIN_EVENT);
  settings.setEventConfig(CHECKIN_EVENT.id, {
    ...checkin,
    enabled: schedule.length > 0 && checkin.enabled,
    schedule,
  });
  await syncNotificationEvents();
};
