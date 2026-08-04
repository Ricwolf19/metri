import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { CameraIcon, ChevronRightIcon, FlameIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import { computeStreak } from '@/features/training/adherence.repo';
import { TrainingCalendar } from '@/features/training/components/TrainingCalendar';
import { bucketVolume, loggedExercises, weeklyVolumeQuery } from '@/features/training/stats.repo';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <View className="flex-1">
    <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">{label}</Text>
    <View className="mt-1 flex-row items-baseline">
      <Text className="text-2xl font-sans-bold text-ink-50">{value}</Text>
      {unit ? <Text className="ml-1 text-sm text-ink-400">{unit}</Text> : null}
    </View>
  </View>
);

const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mb-2 mt-7 text-sm font-sans-semibold text-ink-200">{text}</Text>
);

const fmtVol = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`);

/**
 * Progress tab — the long-term numbers: training volume, streak, calendar,
 * energy profile, and progress photos. Home stays about *today*; this screen is
 * about *over time*.
 */
const Metrics = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();

  const hasBmr = typeof user?.bmr === 'number' && typeof user?.tdee === 'number';
  const userId = user?.id;

  const { data: volumeRows } = useLiveQuery(weeklyVolumeQuery(userId ?? '', 6));
  const volume = useMemo(() => bucketVolume(volumeRows, 6), [volumeRows]);
  const hasVolume = volume.some((w) => w.volume > 0);
  const volumeChart: Chart = {
    kind: 'bars',
    max: Math.max(1, ...volume.map((w) => w.volume)),
    bars: volume.map((w, i) => ({
      label: w.label,
      value: w.volume,
      display: fmtVol(w.volume),
      color: brand,
      highlight: i === volume.length - 1,
    })),
  };

  const streak = userId ? computeStreak(userId) : 0;
  const exercisesLogged = userId ? loggedExercises(userId).slice(0, 6) : [];

  if (!user) return null;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      {/* Training at a glance */}
      <FadeInUp>
        <Card className="flex-row">
          <Stat label={t('metrics.streak')} value={`${streak}`} unit={t('metrics.days')} />
          <Stat
            label={t('metrics.weekVolume')}
            value={fmtVol(volume[volume.length - 1]?.volume ?? 0)}
            unit="kg"
          />
        </Card>
      </FadeInUp>

      {/* Weekly volume trend */}
      {hasVolume ? (
        <FadeInUp delay={60}>
          <SectionLabel text={t('home.trend')} />
          <Card>
            <Text className="mb-3 text-xs text-ink-400">{t('home.weeklyVolume')}</Text>
            <CalcChart chart={volumeChart} />
          </Card>
        </FadeInUp>
      ) : null}

      {/* Consistency calendar */}
      <FadeInUp delay={90}>
        <SectionLabel text={t('adherence.section')} />
        <TrainingCalendar />
      </FadeInUp>

      {/* Per-exercise history */}
      {exercisesLogged.length ? (
        <>
          <SectionLabel text={t('metrics.exHistory')} />
          <Card className="gap-0 py-1">
            {exercisesLogged.map((e, i) => (
              <PressableScale
                key={e.exerciseId}
                onPress={() =>
                  router.push({ pathname: '/training/exercise/[id]', params: { id: e.exerciseId } })
                }
                className={[
                  'flex-row items-center py-3',
                  i > 0 ? 'border-t border-ink-800' : '',
                ].join(' ')}
              >
                <Text
                  className="flex-1 pr-2 text-sm font-sans-medium text-ink-100"
                  numberOfLines={1}
                >
                  {e.name}
                </Text>
                <Text className="mr-2 text-xs text-ink-400">
                  {t('metrics.exSessions', { n: e.sessions })}
                </Text>
                <ChevronRightIcon color="#71717a" size={16} />
              </PressableScale>
            ))}
          </Card>
        </>
      ) : null}

      {/* Energy profile */}
      <SectionLabel text={t('home.energy')} />
      {hasBmr ? (
        <Card>
          <View className="mb-4 flex-row items-center">
            <FlameIcon color={brand} size={18} />
            <Text className="ml-2 font-mono-medium text-xs uppercase tracking-wider text-brand">
              {t('home.energy')}
            </Text>
          </View>
          <View className="flex-row">
            <Stat
              label={t('home.bmr')}
              value={String(Math.round(user.bmr!))}
              unit={t('home.kcalDay')}
            />
            <Stat
              label={t('home.tdee')}
              value={String(Math.round(user.tdee!))}
              unit={t('home.kcalDay')}
            />
          </View>
          <Text className="mt-4 text-xs text-ink-400">
            {user.activityLevel ? t(`activity.${user.activityLevel}`) : ''} ·{' '}
            {user.bmrFormula === 'mifflin_st_jeor' ? 'Mifflin–St Jeor' : 'Harris–Benedict'}
          </Text>
        </Card>
      ) : (
        <Card>
          <Text className="text-base font-sans-semibold text-ink-50">{t('home.noMetrics')}</Text>
          <Text className="mt-1 text-sm text-ink-400">{t('home.noMetricsBody')}</Text>
          <PressableScale
            onPress={() => router.push('/calculators/tdee')}
            className="mt-4 flex-row items-center justify-between rounded-field border border-brand/30 bg-brand/10 px-4 py-3"
          >
            <Text className="font-sans-semibold text-brand">{t('home.openBmr')}</Text>
            <ChevronRightIcon color={brand} size={18} />
          </PressableScale>
        </Card>
      )}

      {/* Progress photos */}
      <View className="mt-7">
        <PressableScale onPress={() => router.push('/progress')}>
          <Card className="flex-row items-center">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
              <CameraIcon color={brand} size={22} />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-base font-sans-semibold text-ink-50">{t('home.progress')}</Text>
              <Text className="mt-0.5 text-sm text-ink-400">{t('home.progressSub')}</Text>
            </View>
            <ChevronRightIcon color="#71717a" />
          </Card>
        </PressableScale>
      </View>
    </Screen>
  );
};

export default Metrics;
