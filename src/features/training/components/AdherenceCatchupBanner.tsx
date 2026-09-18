import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui';
import type { SkipReason } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import { useTodayKey } from '@/lib/useTodayKey';

import { dateFromKey, localDateKey, markTrainingDay, rangeDaysQuery } from '../adherence.repo';
import { activeEnrollmentQuery } from '../enroll';
import { findGaps } from '../streak';
import { SkipReasonChips } from './SkipReasonChips';

const DAYS_BACK = 7;

/** Asks about the oldest PLANNED day of the last week with no entry (trained / missed + reason). Never renders
 * without an enrolled schedule; the Day Detail sheet stays the manual path. Rule: @see AGENTS.md#conventions. */
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
  const { data: rows } = useLiveQuery(rangeDaysQuery(user?.id ?? '', from, today));
  const [askingReason, setAskingReason] = useState(false);

  if (!user || !weekdays?.length) return null;

  // Oldest unresolved planned day, derived live so answering advances the ask.
  const gaps = findGaps(new Set(rows.map((r) => r.date)), weekdays, today, DAYS_BACK);
  const gap = gaps[0] ?? null;
  if (!gap) return null;

  const dayLabel = dateKey(gap);

  const markTrained = () => {
    markTrainingDay(user.id, { date: gap, status: 'trained' });
    setAskingReason(false);
  };
  const markSkipped = (skipReason: SkipReason) => {
    markTrainingDay(user.id, { date: gap, status: 'skipped', skipReason });
    setAskingReason(false);
  };

  return (
    <Card className="mb-3">
      <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {t('adherence.catchupTitle')}
      </Text>
      <Text className="mt-2 text-base font-sans-semibold text-ink-50">
        {t('adherence.catchupQuestion', { day: dayLabel })}
      </Text>

      {askingReason ? (
        <SkipReasonChips onPick={(r) => markSkipped(r)} />
      ) : (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={markTrained}
            accessibilityRole="button"
            className="flex-1 items-center rounded-field border border-brand/40 bg-brand/10 py-3"
          >
            <Text className="text-sm font-sans-semibold text-brand">
              {t('adherence.catchupYes')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAskingReason(true)}
            accessibilityRole="button"
            className="flex-1 items-center rounded-field border border-red-500/40 bg-red-500/10 py-3"
          >
            <Text className="text-sm font-sans-semibold text-red-400">
              {t('adherence.catchupNo')}
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
};
