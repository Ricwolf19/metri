import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { View } from 'react-native';

import { Card, Stat } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { computeStreak, getActiveTrainingWeekdays } from '@/features/training/adherence.repo';
import { fromKg } from '@/features/training/progression';
import { bucketVolume, weeklyVolumeQuery } from '@/features/training/stats.repo';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';

import { fmtVol } from '../format';
import type { MetricsSectionProps } from '../sections';

/** The two numbers that answer "how am I doing" without scrolling: streak and this week's volume. */
export const SummarySection = ({ headerRight }: MetricsSectionProps) => {
  const t = useT();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const unit = settings.getUnits();
  const { data: volumeRows } = useLiveQuery(weeklyVolumeQuery(userId, 6));
  const volume = useMemo(() => bucketVolume(volumeRows, 6), [volumeRows]);
  const streak = userId ? computeStreak(userId, getActiveTrainingWeekdays(userId)) : 0;

  return (
    <>
      {headerRight ? <View className="mb-2 flex-row justify-end">{headerRight}</View> : null}
      <Card className="flex-row">
        <Stat label={t('metrics.streak')} value={`${streak}`} unit={t('metrics.days')} />
        <Stat
          label={t('metrics.weekVolume')}
          value={fmtVol(fromKg(volume[volume.length - 1]?.volume ?? 0, unit))}
          unit={unit}
        />
      </Card>
    </>
  );
};
