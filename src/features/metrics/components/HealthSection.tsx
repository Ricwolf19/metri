import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, SectionLabel, Skeleton, Stat, TextLink } from '@/components/ui';
import { installHealthProvider, openHealthSettings } from '@/features/health/health-connect';
import { HEALTH_METRICS, sleepParts, type HealthMetric } from '@/features/health/health-summary';
import { useHealthData } from '@/features/health/useHealthData';
import { useT, type TranslationKey } from '@/i18n';

import { fmtVol } from '../format';
import type { MetricsSectionProps } from '../sections';

const METRIC_NAME: Record<HealthMetric, TranslationKey> = {
  steps: 'health.metricSteps',
  activeEnergy: 'health.metricActiveEnergy',
  sleep: 'health.metricSleep',
};

const sleepText = (minutes: number): string => {
  const { hours, minutes: rest } = sleepParts(minutes);
  return `${hours}:${String(rest).padStart(2, '0')}`;
};

/**
 * Steps, active energy and sleep from Health Connect — read on this phone,
 * never stored. Until the lifter connects, the card says what is read and why,
 * and asks. Weight and body fat are never imported: the card points to the
 * check-in, where metri's own readings come from.
 */
export const HealthSection = ({ headerRight }: MetricsSectionProps) => {
  const t = useT();
  const router = useRouter();
  const { state, connect, disconnect } = useHealthData();

  const body = (() => {
    switch (state.phase) {
      case 'loading':
        return <Skeleton className="h-16 rounded-field" />;
      case 'unsupported':
        return <Text className="text-sm leading-5 text-ink-400">{t('health.unsupported')}</Text>;
      case 'unavailable':
        return <Text className="text-sm leading-5 text-ink-400">{t('health.unavailable')}</Text>;
      case 'needsProvider':
        return (
          <>
            <Text className="text-sm leading-5 text-ink-400">{t('health.needsProvider')}</Text>
            <View className="mt-3">
              <Button
                label={t('health.install')}
                variant="secondary"
                onPress={installHealthProvider}
              />
            </View>
          </>
        );
      case 'off':
        return (
          <>
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('health.connectTitle')}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ink-400">{t('health.connectBody')}</Text>
            <View className="mt-3">
              <Button label={t('health.connect')} variant="brand" onPress={() => void connect()} />
            </View>
          </>
        );
      case 'ready': {
        const { summary, granted } = state;
        const missing = HEALTH_METRICS.filter((m) => !granted.includes(m));
        const avg = [
          summary.average.steps != null
            ? t('health.avgSteps', { n: fmtVol(summary.average.steps) })
            : null,
          summary.average.activeKcal != null
            ? t('health.avgKcal', { n: summary.average.activeKcal })
            : null,
          summary.average.sleepMin != null
            ? t('health.avgSleep', { value: sleepText(summary.average.sleepMin) })
            : null,
        ].filter(Boolean);
        return (
          <>
            <View className="flex-row">
              <Stat
                label={t('health.stepsToday')}
                value={summary.today.steps != null ? fmtVol(summary.today.steps) : '—'}
              />
              <Stat
                label={t('health.activeToday')}
                value={summary.today.activeKcal != null ? String(summary.today.activeKcal) : '—'}
                unit="kcal"
              />
              <Stat
                label={t('health.lastNight')}
                value={
                  summary.lastNightSleepMin != null ? sleepText(summary.lastNightSleepMin) : '—'
                }
                unit="h"
              />
            </View>
            <Text className="mt-3 text-xs leading-5 text-ink-400">
              {avg.length ? t('health.average', { parts: avg.join(' · ') }) : t('health.noData')}
            </Text>
            {missing.length ? (
              <Text className="mt-1 text-xs leading-5 text-ink-500">
                {t('health.notShared', { list: missing.map((m) => t(METRIC_NAME[m])).join(', ') })}
              </Text>
            ) : null}
            <View className="mt-2 flex-row flex-wrap gap-x-4">
              <TextLink label={t('health.manage')} onPress={openHealthSettings} />
              <TextLink label={t('health.disconnect')} onPress={() => void disconnect()} />
            </View>
          </>
        );
      }
    }
  })();

  return (
    <>
      <SectionLabel label={t('metrics.sectionHealth')} right={headerRight} className="mt-0" />
      <Card>
        {body}
        <View className="mt-4 border-t border-ink-700 pt-3">
          <Text className="text-xs leading-5 text-ink-500">{t('health.manualNote')}</Text>
          <TextLink label={t('health.openCheckin')} onPress={() => router.push('/body/checkin')} />
        </View>
      </Card>
    </>
  );
};
