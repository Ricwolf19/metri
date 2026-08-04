import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/db/schema';
import {
  computeStreak,
  dayQuery,
  localDateKey,
  rangeDaysQuery,
} from '@/features/training/adherence.repo';
import { session, settings } from '@/lib/storage';

import type { WeekDay, WidgetSnapshot } from './snapshot';

/** The last 7 device-local day keys ending on `today`, oldest first. */
const weekKeys = (today: string): string[] => {
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => localDateKey(new Date(y, m - 1, d - 6 + i)));
};

/** Build the snapshot from local state. Null when nobody is signed in. */
export const computeWidgetSnapshot = (): WidgetSnapshot | null => {
  const userId = session.getUserId();
  if (!userId) return null;

  const today = localDateKey();
  const [row] = db.select({ tdee: users.tdee }).from(users).where(eq(users.id, userId)).all();
  const [day] = dayQuery(userId, today).all();

  const keys = weekKeys(today);
  const logged = new Map(
    rangeDaysQuery(userId, keys[0], today)
      .all()
      .map((r) => [r.date, r.status]),
  );
  const week: WeekDay[] = keys.map((date) => ({ date, status: logged.get(date) ?? 'none' }));

  return {
    tdee: row?.tdee ?? null,
    trainedToday: day?.status === 'trained',
    streak: computeStreak(userId, today),
    week,
    locale: settings.getLocale() ?? 'en',
    updatedAt: Date.now(),
  };
};
