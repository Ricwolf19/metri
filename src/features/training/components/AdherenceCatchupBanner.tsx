import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, TextLink } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { SkipReason, TrainingDayStatus } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useT, type TranslationKey } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTodayKey } from '@/lib/useTodayKey';

import { DEFAULT_CHECKIN_OFFSET_MIN, NOTIFICATION_EVENTS } from '@/features/notifications/events';
import { getEventConfig } from '@/features/notifications/policies';

import { dateFromKey, localDateKey, markTrainingDay, rangeDaysQuery } from '../adherence.repo';
import { activeEnrollmentQuery } from '../enroll';
import { weekdayOfDate } from '../schedule';
import { findGaps } from '../streak';
import { SkipReasonChips } from './SkipReasonChips';

const CHECKIN_EVENT = NOTIFICATION_EVENTS.find((e) => e.id === 'session-checkin')!;
const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** A month back: far enough to close a holiday, near enough that answering stays honest. */
const DAYS_BACK = 30;

const CHOICES: {
  status: TrainingDayStatus;
  key: TranslationKey;
  box: string;
  label: string;
}[] = [
  {
    status: 'trained',
    key: 'adherence.catchupYes',
    box: 'border-brand/40 bg-brand/10',
    label: 'text-brand',
  },
  {
    status: 'rest',
    key: 'adherence.catchupRest',
    box: 'border-ink-700 bg-ink-800',
    label: 'text-ink-200',
  },
  {
    status: 'skipped',
    key: 'adherence.catchupNo',
    box: 'border-red-500/40 bg-red-500/10',
    label: 'text-red-400',
  },
];

/** Asks about the oldest PLANNED day of the last month with no entry (trained / rest / missed + reason), and
 * offers to clear the backlog in one go. Never renders without an enrolled schedule; the Day Detail sheet
 * stays the manual path. */
export const AdherenceCatchupBanner = () => {
  const t = useT();
  const { dateKey } = useDateFormat();
  const { user } = useAuth();
  const today = useTodayKey();
  // Live: starting or abandoning a program must show/hide the banner at once.
  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''), [user?.id]);
  const weekdays = enrollments[0]?.trainingWeekdays?.length
    ? enrollments[0].trainingWeekdays
    : null;

  const fromDate = dateFromKey(today);
  fromDate.setDate(fromDate.getDate() - DAYS_BACK);
  const from = localDateKey(fromDate);
  // Deps are load-bearing, not an optimisation: without them the query stays
  // bound to the mount-time user (often '') and to the day the screen mounted.
  // An empty result makes every planned day look unresolved, and "mark the rest
  // as missed" would then write over real history.
  const { data: rows } = useLiveQuery(rangeDaysQuery(user?.id ?? '', from, today), [
    user?.id,
    from,
    today,
  ]);
  const [askingReason, setAskingReason] = useState(false);
  // The check-in fires a few hours after a session, so today becomes answerable
  // once that moment passes. Snapshot the clock on focus — never read it in render.
  const [checkin] = useState(() => getEventConfig(CHECKIN_EVENT));
  const [nowMinutes, setNowMinutes] = useState(() => minutesOfDay(new Date()));
  useFocusEffect(
    useCallback(() => {
      setNowMinutes(minutesOfDay(new Date()));
    }, []),
  );

  if (!user || !weekdays?.length) return null;

  // Oldest unresolved planned day, derived live so answering advances the ask.
  const logged = new Set(rows.map((r) => r.date));
  const past = findGaps(logged, weekdays, today, DAYS_BACK);
  // Today leads when its session has been and gone: it is what the check-in
  // notification just asked about, and the backlog can wait one more tap.
  const offset = checkin.offsetMinutes ?? DEFAULT_CHECKIN_OFFSET_MIN;
  const dueToday =
    !logged.has(today) &&
    (checkin.schedule ?? []).some(
      (entry) =>
        entry.weekday === weekdayOfDate(dateFromKey(today)) &&
        entry.hour * 60 + entry.minute + offset <= nowMinutes,
    );
  const gaps = dueToday ? [today, ...past] : past;
  const gap = gaps[0] ?? null;
  if (!gap) return null;

  const mark = (status: TrainingDayStatus, skipReason?: SkipReason) => {
    if (status === 'skipped' && !skipReason) {
      setAskingReason(true);
      return;
    }
    markTrainingDay(user.id, { date: gap, status, skipReason: skipReason ?? null });
    setAskingReason(false);
  };

  // Clearing a long gap in one tap. No reason is asked: one would be a guess
  // applied to every day at once, and the day sheet can still refine any of them.
  const markAllMissed = () => {
    for (const date of gaps)
      markTrainingDay(user.id, { date, status: 'skipped', skipReason: null });
    setAskingReason(false);
  };

  return (
    <Card className="mb-3">
      <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('adherence.catchupTitle')}
      </Text>
      <Text className="mt-2 text-base font-sans-semibold text-ink-50">
        {t('adherence.catchupQuestion', { day: dateKey(gap) })}
      </Text>
      {gaps.length > 1 ? (
        <Text className="mt-1 text-xs text-ink-400">
          {t('adherence.catchupCount', { n: gaps.length })}
        </Text>
      ) : null}

      {askingReason ? (
        <SkipReasonChips onPick={(reason) => mark('skipped', reason)} />
      ) : (
        <>
          <View className="mt-3 flex-row gap-2">
            {CHOICES.map((choice) => (
              <Pressable
                key={choice.status}
                onPress={() => mark(choice.status)}
                accessibilityRole="button"
                className={['flex-1 items-center rounded-field border py-3', choice.box].join(' ')}
              >
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  className={['text-sm font-sans-semibold', choice.label].join(' ')}
                >
                  {t(choice.key)}
                </Text>
              </Pressable>
            ))}
          </View>
          {gaps.length > 1 ? (
            <View className="mt-3 items-center">
              <TextLink
                label={t('adherence.catchupBulk', { n: gaps.length })}
                onPress={markAllMissed}
              />
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
};
