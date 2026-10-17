import { useCallback } from 'react';

import { View } from 'react-native';

import { Card, Stat } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { computeStreak, getActiveTrainingWeekdays } from '@/features/training/adherence.repo';
import { fromKgHalf } from '@/features/training/progression';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useFocusRead } from '@/lib/useFocusRead';

import { fmtVol } from '../format';
import { useWeeklyVolume } from '../MetricsData';
import type { MetricsSectionProps } from '../sections';

/** The two numbers that answer "how am I doing" without scrolling: streak and this week's volume. */
export const SummarySection = ({ headerRight }: MetricsSectionProps) => {
  const t = useT();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const unit = settings.getUnits();
  const volume = useWeeklyVolume();
  // A synchronous read, once per return to the tab rather than on every render.
  const streak = useFocusRead(
    useCallback(
      () => (userId ? computeStreak(userId, getActiveTrainingWeekdays(userId)) : 0),
      [userId],
    ),
  );

  return (
    <>
      {headerRight ? <View className="mb-2 flex-row justify-end">{headerRight}</View> : null}
      <Card className="flex-row">
        <Stat label={t('metrics.streak')} value={`${streak}`} unit={t('metrics.days')} />
        <Stat
          label={t('metrics.weekVolume')}
          value={fmtVol(fromKgHalf(volume[volume.length - 1]?.volume ?? 0, unit))}
          unit={unit}
        />
      </Card>
    </>
  );
};
