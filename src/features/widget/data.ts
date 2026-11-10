import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/db/schema';
import { workoutUrl } from '@/features/notifications/notification-content';
import {
  computeStreak,
  dayQuery,
  getActiveTrainingWeekdays,
  localDateKey,
  rangeDaysQuery,
} from '@/features/training/adherence.repo';
import { daysQuery } from '@/features/training/authoring.repo';
import { activeEnrollmentQuery } from '@/features/training/enroll';
import { dayDisplayName, WEEKDAY_KEY } from '@/features/training/labels';
import { formatClockTime, nextPendingSplit, weekdayOfDate } from '@/features/training/schedule';
import { completedDaysQuery } from '@/features/training/session.repo';
import { sessionState } from '@/features/training/session-state';
import { monthlyWorkouts } from '@/features/training/stats.repo';
import { resolveLocale, tFor, type TFunction, type TranslationKey } from '@/i18n';
import { session, settings } from '@/lib/storage';

import { currentWeekKeys, weekA11yLabel, type WeekDay, type WidgetSnapshot } from './snapshot';

const TODAY_KEY: Record<WidgetSnapshot['today'], TranslationKey> = {
  trained: 'widget.today.trained',
  rest: 'widget.today.rest',
  skipped: 'widget.today.skipped',
  active: 'widget.today.active',
  none: 'widget.mark',
};

/** The workout in progress, from the notification's own record (MMKV, headless-safe). */
const liveSession = (t: TFunction): WidgetSnapshot['live'] => {
  const record = sessionState.get();
  if (!record) return null;
  const next = record.next;
  return {
    title: t('widget.live'),
    line: next
      ? [next.exerciseName, next.setLabel].filter(Boolean).join(' · ')
      : (record.doneLabel ?? null),
    url: workoutUrl(record.workoutId, next?.slotId),
  };
};

/**
 * The split up next — the Train tab's rule (`nextPendingSplit`: the first
 * split of the week without a session) — and when it is scheduled.
 */
const nextSplit = (userId: string, t: TFunction, now: Date): WidgetSnapshot['next'] => {
  const [enrollment] = activeEnrollmentQuery(userId).all();
  if (!enrollment || enrollment.status !== 'active' || !enrollment.currentRoutineId) return null;
  const days = daysQuery(enrollment.currentRoutineId).all();
  const resolved = new Set(
    completedDaysQuery(enrollment.id, enrollment.currentWeek)
      .all()
      .map((r) => r.dayId),
  );
  const pending = nextPendingSplit(days, resolved);
  if (!pending) return { name: t('widget.weekDone'), when: null };
  const time =
    pending.startMinute != null
      ? formatClockTime(pending.startMinute, settings.getClockFormat())
      : null;
  const when =
    pending.weekday == null
      ? time
      : pending.weekday === weekdayOfDate(now)
        ? t('widget.today', { time: time ?? '' }).trim()
        : [t(WEEKDAY_KEY[pending.weekday]), time].filter(Boolean).join(' · ');
  return { name: dayDisplayName(pending, t), when };
};

/** Build the snapshot from local state. Null when nobody is signed in. */
export const computeWidgetSnapshot = (now = new Date()): WidgetSnapshot | null => {
  const userId = session.getUserId();
  if (!userId) return null;
  // The device language when none was picked — the same rule as the app.
  const locale = resolveLocale();
  const t = tFor(locale);

  const today = localDateKey(now);
  const [row] = db.select({ tdee: users.tdee }).from(users).where(eq(users.id, userId)).all();
  const [day] = dayQuery(userId, today).all();
  const todayStatus = day?.status ?? 'none';

  const keys = currentWeekKeys(today);
  const logged = new Map(
    rangeDaysQuery(userId, keys[0], keys[6])
      .all()
      .map((r) => [r.date, r.status]),
  );
  const week: WeekDay[] = keys.map((date) => ({ date, status: logged.get(date) ?? 'none' }));
  const streak = computeStreak(userId, getActiveTrainingWeekdays(userId), today);
  const live = liveSession(t);

  return {
    tdee: row?.tdee ?? null,
    today: todayStatus,
    streak,
    week,
    live,
    next: live ? null : nextSplit(userId, t, now),
    monthly: monthlyWorkouts(userId, 6).map((m) => m.count),
    copy: {
      badge: live ? t('widget.live') : t(TODAY_KEY[todayStatus]),
      streak: t(streak === 1 ? 'widget.streakOne' : 'widget.streak', { n: streak }),
      tdee: t('widget.tdee'),
      monthly: t('widget.monthly'),
      empty: t('widget.noProgram'),
      emptyHint: t('widget.noProgramHint'),
      pills: [t('widget.pill.train'), t('widget.pill.metrics'), t('widget.pill.photos')],
      week: weekA11yLabel(week, today, t),
    },
    locale,
    updatedAt: now.getTime(),
  };
};
