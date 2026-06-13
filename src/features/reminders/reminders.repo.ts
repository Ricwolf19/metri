import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { reminders, type Reminder, type ReminderFrequency } from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { cancelReminder, ensureNotificationPermission, scheduleReminder } from './scheduler';

/** Live query of a user's reminders — wrap with Drizzle's `useLiveQuery` in the UI. */
export const remindersQuery = (userId: string) =>
  db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(desc(reminders.createdAt));

export const getReminder = (id: string): Reminder | null => {
  const [row] = db.select().from(reminders).where(eq(reminders.id, id)).all();
  return row ?? null;
};

export type ReminderInput = {
  title: string;
  body?: string;
  frequency: ReminderFrequency;
  hour: number;
  minute: number;
  weekdays?: number[] | null;
  enabled: boolean;
};

/** Weekly needs at least one day (default Monday); daily clears the day list. */
const normalizeWeekdays = (input: ReminderInput): number[] | null =>
  input.frequency === 'weekly'
    ? input.weekdays?.length
      ? [...input.weekdays].sort((a, b) => a - b)
      : [2]
    : null;

/** Best-effort OS scheduling — returns the notification ids, or null if disabled/denied/unavailable. */
const scheduleIfEnabled = async (r: Reminder): Promise<string[] | null> => {
  if (!r.enabled) return null;
  try {
    if (!(await ensureNotificationPermission())) return null;
    return await scheduleReminder(r);
  } catch {
    return null;
  }
};

export const createReminder = async (userId: string, input: ReminderInput): Promise<Reminder> => {
  const [row] = db
    .insert(reminders)
    .values({ id: randomId(), userId, ...input, weekdays: normalizeWeekdays(input) })
    .returning()
    .all();
  const notificationIds = await scheduleIfEnabled(row);
  const [saved] = db
    .update(reminders)
    .set({ notificationIds })
    .where(eq(reminders.id, row.id))
    .returning()
    .all();
  return saved;
};

export const updateReminder = async (
  id: string,
  input: ReminderInput,
): Promise<Reminder | null> => {
  const existing = getReminder(id);
  if (!existing) return null;
  await cancelReminder(existing.notificationIds);

  const [row] = db
    .update(reminders)
    .set({ ...input, weekdays: normalizeWeekdays(input), updatedAt: new Date() })
    .where(eq(reminders.id, id))
    .returning()
    .all();
  const notificationIds = await scheduleIfEnabled(row);
  const [saved] = db
    .update(reminders)
    .set({ notificationIds })
    .where(eq(reminders.id, id))
    .returning()
    .all();
  return saved;
};

export const setReminderEnabled = async (id: string, enabled: boolean): Promise<void> => {
  const existing = getReminder(id);
  if (!existing) return;
  await cancelReminder(existing.notificationIds);
  const notificationIds = enabled ? await scheduleIfEnabled({ ...existing, enabled: true }) : null;
  db.update(reminders)
    .set({ enabled, notificationIds, updatedAt: new Date() })
    .where(eq(reminders.id, id))
    .run();
};

export const deleteReminder = async (id: string): Promise<void> => {
  const existing = getReminder(id);
  await cancelReminder(existing?.notificationIds);
  db.delete(reminders).where(eq(reminders.id, id)).run();
};
