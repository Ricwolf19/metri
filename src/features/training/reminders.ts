import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { userPrograms, workoutDays } from '@/db/schema';
import { NOTIFICATION_EVENTS } from '@/features/notifications/events';
import { getEventConfig, syncNotificationEvents } from '@/features/notifications/policies';
import { settings } from '@/lib/storage';

import { fromHourMinute, reminderEntries, toHourMinute, type ScheduledDay } from './schedule';

const TRAINING_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'training-time')!;
const CHECKIN_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'session-checkin')!;

/** The time an older build's plan trained at — the most common split start — or null. Seeds the
 * reminder time once, so an upgrade never moves a 7 am reminder to the 18:00 default. */
const legacyStartMinute = (days: readonly ScheduledDay[]): number | null => {
  const counts = new Map<number, number>();
  for (const d of days) {
    if (d.startMinute != null) counts.set(d.startMinute, (counts.get(d.startMinute) ?? 0) + 1);
  }
  let best: number | null = null;
  for (const [minute, n] of counts) if (best == null || n > counts.get(best)!) best = minute;
  return best;
};

/** Point the schedule-driven reminders at the active phase (one entry per training weekday, at the
 * training-time event's own hour); no enrollment/schedule → off. Both events store the RAW training
 * time: the check-in applies its own delay when scheduling, so changing that delay never needs the
 * program re-read. `enable` switches training time on (start flow); otherwise the user's toggle is
 * kept. Changing the time = write the event's hour/minute, then call this again. */
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
  const stored = getEventConfig(TRAINING_EVENT);
  const legacy = stored.timeSet ? null : legacyStartMinute(days);
  const current = legacy == null ? stored : { ...stored, ...toHourMinute(legacy), timeSet: true };
  const schedule = reminderEntries(days, fromHourMinute(current.hour, current.minute));
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
