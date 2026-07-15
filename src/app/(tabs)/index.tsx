import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon, FlameIcon, GearIcon, PlayIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { CalcChart } from '@/features/calculators/components/CalcChart';
import type { CalcChart as Chart } from '@/features/calculators/types';
import {
  DEFAULT_PINNED_ACTIONS,
  getQuickAction,
  type QuickAction,
} from '@/features/home/quick-actions';
import { PremiumIntroModal } from '@/features/premium/PremiumIntroModal';
import { TodayAdherence } from '@/features/training/components/TodayAdherence';
import { setEnrollmentPosition } from '@/features/training/enroll';
import { activeWorkoutQuery, startWorkout } from '@/features/training/session.repo';
import { bucketVolume, weeklyVolumeQuery } from '@/features/training/stats.repo';
import { nextWorkoutDay, useEnrollment } from '@/features/training/useEnrollment';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => {
  return (
    <View className="flex-1">
      <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
        {label}
      </Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className="text-2xl font-sans-bold text-ink-50">{value}</Text>
        <Text className="ml-1 text-sm text-ink-400">{unit}</Text>
      </View>
    </View>
  );
};

const QuickActionCard = ({ action }: { action: QuickAction }) => {
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();
  const Icon = action.icon;
  return (
    <PressableScale onPress={() => router.push(action.href)}>
      <Card className="flex-row items-center">
        <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
          <Icon color={brand} size={22} />
        </View>
        <View className="flex-1 pr-2">
          <Text className="text-base font-sans-semibold text-ink-50">{t(action.titleKey)}</Text>
          <Text className="mt-0.5 text-sm text-ink-400">{t(action.subKey)}</Text>
        </View>
        <ChevronRightIcon color="#71717a" />
      </Card>
    </PressableScale>
  );
};

const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mb-2 mt-8 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
    {text}
  </Text>
);

const fmtVol = (v: number): string => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`);

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();

  const firstName = (user?.displayName ?? user?.username ?? '').split(' ')[0];
  const hasBmr = typeof user?.bmr === 'number' && typeof user?.tdee === 'number';

  const { enrollment, structure } = useEnrollment(user?.id ?? '');
  const { data: actives } = useLiveQuery(activeWorkoutQuery(user?.id ?? ''));
  const activeWorkout = actives[0] ?? null;
  const nextDay = enrollment && structure ? nextWorkoutDay(enrollment.id, structure.days) : null;

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

  const [pinnedIds, setPinnedIds] = useState<string[]>(
    () => settings.getPinnedActions() ?? DEFAULT_PINNED_ACTIONS,
  );
  useFocusEffect(
    useCallback(() => {
      setPinnedIds(settings.getPinnedActions() ?? DEFAULT_PINNED_ACTIONS);
    }, []),
  );
  const pinned = pinnedIds.map(getQuickAction).filter((a): a is QuickAction => Boolean(a));

  const startNext = () => {
    if (!user || !enrollment || !structure?.currentRoutine || !nextDay) return;
    if (enrollment.currentRoutineId !== structure.currentRoutine.id) {
      setEnrollmentPosition(enrollment.id, structure.currentRoutine.id, enrollment.currentWeek);
    }
    const workout = startWorkout(user.id, enrollment.id, nextDay.id, enrollment.currentWeek);
    router.push({ pathname: '/training/workout/[id]', params: { id: workout.id } });
  };

  return (
    <Screen scroll edges={['top']} contentClassName="px-5 pb-8">
      <PremiumIntroModal />
      <TopBar
        title={t('home.greeting', { name: firstName || t('home.lifter') })}
        subtitle={t('home.subtitle')}
      />

      {/* Training hero — what to do right now */}
      <FadeInUp>
        {activeWorkout ? (
          <PressableScale
            onPress={() =>
              router.push({ pathname: '/training/workout/[id]', params: { id: activeWorkout.id } })
            }
          >
            <View className="mt-1 flex-row items-center rounded-card border border-brand/30 bg-brand/10 p-5">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
                <PlayIcon color={brand} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-brand">{t('training.resume')}</Text>
                <Text className="mt-0.5 text-sm text-ink-400">{t('training.resumeBody')}</Text>
              </View>
              <ChevronRightIcon color={brand} />
            </View>
          </PressableScale>
        ) : enrollment && structure?.program && nextDay ? (
          <Card className="mt-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-mono-medium text-xs uppercase tracking-wider text-brand">
                {t('home.nextUp')}
              </Text>
              <Text className="font-mono-medium text-[11px] uppercase tracking-wider text-ink-400">
                {t('training.weekN', { n: structure.programWeek })}
              </Text>
            </View>
            <Text className="mt-1 text-xl font-sans-bold text-ink-50">{nextDay.name}</Text>
            <Text className="mt-0.5 text-sm text-ink-400">{structure.program.name}</Text>
            <View className="mt-4">
              <Button
                label={t('home.startWorkout')}
                leftIcon={<PlayIcon color="#09090b" size={18} />}
                onPress={startNext}
              />
            </View>
            <Pressable
              onPress={() => router.push('/training')}
              accessibilityRole="button"
              className="mt-3 items-center"
            >
              <Text className="text-xs font-sans-semibold text-ink-400">
                {t('home.pickAnotherDay')}
              </Text>
            </Pressable>
          </Card>
        ) : (
          <PressableScale onPress={() => router.push('/training/programs')}>
            <Card className="mt-1 flex-row items-center">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
                <DumbbellIcon color={brand} size={22} />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-base font-sans-semibold text-ink-50">
                  {t('home.startTraining')}
                </Text>
                <Text className="mt-0.5 text-sm text-ink-400">{t('home.startTrainingSub')}</Text>
              </View>
              <ChevronRightIcon color="#71717a" />
            </Card>
          </PressableScale>
        )}
      </FadeInUp>

      {/* Today's adherence */}
      <FadeInUp delay={60}>
        <View className="mt-4">
          <TodayAdherence />
        </View>
      </FadeInUp>

      {/* Energy (calories at a glance) */}
      <FadeInUp delay={120}>
        {hasBmr ? (
          <Card className="mt-4">
            <View className="mb-4 flex-row items-center">
              <FlameIcon color={brand} size={18} />
              <Text className="ml-2 font-mono-medium text-xs uppercase tracking-wider text-brand">
                {t('home.energy')}
              </Text>
            </View>
            <View className="flex-row">
              <Stat
                label={t('home.bmr')}
                value={String(Math.round(user!.bmr!))}
                unit={t('home.kcalDay')}
              />
              <Stat
                label={t('home.tdee')}
                value={String(Math.round(user!.tdee!))}
                unit={t('home.kcalDay')}
              />
            </View>
            <Text className="mt-4 text-xs text-ink-400">
              {user?.activityLevel ? t(`activity.${user.activityLevel}`) : ''} ·{' '}
              {user?.bmrFormula === 'mifflin_st_jeor' ? 'Mifflin–St Jeor' : 'Harris–Benedict'}
            </Text>
          </Card>
        ) : (
          <Card className="mt-4">
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
      </FadeInUp>

      {/* Weekly volume trend */}
      {hasVolume ? (
        <FadeInUp delay={180}>
          <SectionLabel text={t('home.trend')} />
          <Card>
            <Text className="mb-3 text-xs text-ink-400">{t('home.weeklyVolume')}</Text>
            <CalcChart chart={volumeChart} />
          </Card>
        </FadeInUp>
      ) : null}

      {/* Quick actions → tools & docs */}
      <View className="mb-2 mt-8 flex-row items-center justify-between">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('home.quickActions')}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={() => router.push('/home-customize')}
          accessibilityRole="button"
          accessibilityLabel={t('home.customize')}
          className="flex-row items-center"
        >
          <GearIcon color="#71717a" size={14} />
          <Text className="ml-1 text-xs font-sans-semibold text-ink-400">
            {t('home.customize')}
          </Text>
        </Pressable>
      </View>

      {pinned.length === 0 ? (
        <FadeInUp>
          <PressableScale onPress={() => router.push('/home-customize')}>
            <Card className="items-center py-6">
              <Text className="text-center text-sm text-ink-400">{t('home.noPinned')}</Text>
            </Card>
          </PressableScale>
        </FadeInUp>
      ) : (
        <View className="gap-3">
          {pinned.map((action, i) => (
            <FadeInUp key={action.id} delay={i * 70}>
              <QuickActionCard action={action} />
            </FadeInUp>
          ))}
        </View>
      )}
    </Screen>
  );
};

export default Home;
