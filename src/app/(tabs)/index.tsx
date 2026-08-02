import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, DumbbellIcon, GearIcon, PlayIcon, PlusIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import { Button, Card, FadeInUp, PressableScale, Screen } from '@/components/ui';
import { AnnouncementModal } from '@/features/announcements/AnnouncementModal';
import { useAuth } from '@/features/auth/auth-context';
import { getQuickAction, type QuickAction } from '@/features/home/quick-actions';
import { PremiumIntroModal } from '@/features/premium/PremiumIntroModal';
import { TodayAdherence } from '@/features/training/components/TodayAdherence';
import { WeekStrip } from '@/features/training/components/WeekStrip';
import { setEnrollmentPosition } from '@/features/training/enroll';
import { activeWorkoutQuery, startWorkout } from '@/features/training/session.repo';
import { nextWorkoutDay, useEnrollment } from '@/features/training/useEnrollment';
import { useT } from '@/i18n';
import { settings } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

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

/**
 * Home = today, nothing else: the workout to do right now, the "did you train?"
 * check-in with the week at a glance, and the user's own pinned shortcuts.
 * Detailed metrics live in the Progress tab.
 */
const Home = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();

  const { enrollment, structure } = useEnrollment(user?.id ?? '');
  const { data: actives } = useLiveQuery(activeWorkoutQuery(user?.id ?? ''));
  const activeWorkout = actives[0] ?? null;
  const nextDay = enrollment && structure ? nextWorkoutDay(enrollment.id, structure.days) : null;

  // Pinned quick actions live in MMKV; none by default — the invite card below
  // explains how to add them. Re-read on focus so edits show on return.
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => settings.getPinnedActions() ?? []);
  useFocusEffect(
    useCallback(() => {
      setPinnedIds(settings.getPinnedActions() ?? []);
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
      <AnnouncementModal />
      <TopBar menu showFaq showBeta />

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

      {/* Today's check-in + the week at a glance */}
      <FadeInUp delay={60}>
        <View className="mt-4 gap-3">
          <TodayAdherence />
          <WeekStrip />
        </View>
      </FadeInUp>

      {/* Quick access — user-curated shortcuts */}
      <View className="mb-2 mt-8 flex-row items-center justify-between">
        <Text className="text-sm font-sans-semibold text-ink-200">{t('home.quickActions')}</Text>
        {pinned.length > 0 ? (
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
        ) : null}
      </View>

      {pinned.length === 0 ? (
        <FadeInUp>
          <PressableScale onPress={() => router.push('/home-customize')}>
            <Card className="items-center border-dashed py-6">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-800">
                <PlusIcon color="#a1a1aa" size={20} />
              </View>
              <Text className="mt-3 text-center text-sm font-sans-medium text-ink-200">
                {t('home.quickEmptyTitle')}
              </Text>
              <Text className="mt-1 px-6 text-center text-xs text-ink-400">
                {t('home.quickEmptyBody')}
              </Text>
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
