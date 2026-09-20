import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ChevronRightIcon, PlayIcon, PlusIcon, SparksIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  BlockingOverlay,
  Card,
  FadeInUp,
  HoldButton,
  PressableScale,
  Screen,
  Skeleton,
  useDialog,
  useToast,
  SectionLabel,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { ProgramCard } from '@/features/training/components/ProgramCard';
import { presetProgramCopy } from '@/features/training/programs';
import { SplitRow } from '@/features/training/components/SplitRow';
import { abandonEnrollment, setEnrollmentPosition } from '@/features/training/enroll';
import { WEEKDAY_KEY, dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { ownProgramsQuery, recommendedProgramsQuery } from '@/features/training/programs.repo';
import { syncTrainingReminder } from '@/features/training/reminders';
import {
  formatClockTime,
  nextScheduledSplit,
  splitsForWeekday,
  weekdayOfDate,
  type ScheduledDay,
} from '@/features/training/schedule';
import {
  activeWorkoutQuery,
  completedDayIdsForWeek,
  startWorkout,
} from '@/features/training/session.repo';
import { useEnrollment } from '@/features/training/useEnrollment';
import { useI18n, useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';
import { useTheme } from '@/theme/theme-context';

// Lets the overlay paint before the synchronous write.
const OVERLAY_PAINT_MS = 50;

/** Train tab: active program (today's splits + Play) first, then own programs, curated presets, create. */
const Training = () => {
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand, muted } = useTheme();
  const clock = useClockFormat();
  const userId = user?.id ?? '';

  const { enrollment, structure, loaded } = useEnrollment(userId);
  const { data: actives } = useLiveQuery(activeWorkoutQuery(userId), [userId]);
  const { data: recommended } = useLiveQuery(recommendedProgramsQuery());
  const { data: own } = useLiveQuery(ownProgramsQuery(userId), [userId]);
  const activeWorkout = actives[0] ?? null;

  // Snapshot on focus: an overnight tab shows the right day without a clock read in render.
  const [busy, setBusy] = useState<'starting' | 'abandoning' | null>(null);
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));
  const today = weekdayOfDate(now);

  if (!user) return null;

  const days = structure?.days ?? [];
  const todaySplits = splitsForWeekday(days, today);
  const todayIds = new Set(todaySplits.map((d) => d.id));
  const otherSplits = days.filter((d) => !todayIds.has(d.id));
  const next = nextScheduledSplit(days, now);
  const activeProgramId = structure?.program?.id ?? null;
  const ownVisible = own.filter((p) => p.id !== activeProgramId);
  const recommendedVisible = recommended.filter((p) => p.id !== activeProgramId);

  const scheduleLabel = (day: ScheduledDay) =>
    day.weekday != null && day.startMinute != null
      ? `${t(WEEKDAY_KEY[day.weekday])} · ${formatClockTime(day.startMinute, clock)}`
      : null;

  // Both flows write a tree of rows synchronously; the overlay paints first so
  // the tap never looks ignored.
  const completed = enrollment
    ? completedDayIdsForWeek(enrollment.id, enrollment.currentWeek)
    : new Set<string>();

  const begin = (dayId: string) => {
    const routine = structure?.currentRoutine;
    if (!enrollment || !routine) return;
    setBusy('starting');
    // Read through the captured row, not the live one: by the time the timer
    // fires the query may have produced a different object.
    setTimeout(() => {
      if (enrollment.currentRoutineId !== routine.id) {
        setEnrollmentPosition(enrollment.id, routine.id, enrollment.currentWeek);
      }
      const workout = startWorkout(user.id, enrollment.id, dayId, enrollment.currentWeek, locale);
      setBusy(null);
      router.push({ pathname: '/training/workout/[id]', params: { id: workout.id } });
    }, OVERLAY_PAINT_MS);
  };

  // A split the plan already counts as done can be repeated, but not by accident.
  const startDay = (dayId: string) => {
    if (!completed.has(dayId)) return begin(dayId);
    dialog.confirm({
      title: t('training.redoTitle'),
      message: t('training.redoBody'),
      confirmLabel: t('training.redoConfirm'),
      onConfirm: () => begin(dayId),
    });
  };

  const abandon = () => {
    if (!enrollment) return;
    setBusy('abandoning');
    setTimeout(() => {
      abandonEnrollment(enrollment.id);
      void syncTrainingReminder(user.id);
      setBusy(null);
      toast.info(t('training.abandonedToast'));
    }, OVERLAY_PAINT_MS);
  };

  const playDisabled = !!activeWorkout;

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-32"
      header={<TopBar menu showFaq showBeta />}
    >
      {activeWorkout ? (
        <FadeInUp>
          <PressableScale
            onPress={() =>
              router.push({ pathname: '/training/workout/[id]', params: { id: activeWorkout.id } })
            }
          >
            <View className="mb-4 flex-row items-center rounded-card border border-brand/30 bg-brand/10 p-5">
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
        </FadeInUp>
      ) : null}

      {!loaded ? (
        <View className="gap-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </View>
      ) : null}

      {loaded && enrollment && structure?.program ? (
        <FadeInUp delay={60}>
          <Card>
            <Text className="text-xl font-sans-bold text-ink-50">
              {presetProgramCopy(structure.program.id, locale)?.name ?? structure.program.name}
            </Text>
            <Text className="mt-0.5 text-sm text-ink-400">
              {structure.currentRoutine
                ? `${routineDisplayName(structure.currentRoutine, t)} · `
                : ''}
              {t('training.weekOf', { week: structure.programWeek, total: structure.totalWeeks })}
            </Text>

            {todaySplits.length ? (
              <>
                <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-brand">
                  {t('training.today')}
                </Text>
                <View className="gap-2">
                  {todaySplits.map((day) => (
                    <SplitRow
                      key={day.id}
                      name={dayDisplayName(day, t)}
                      label={scheduleLabel(day)}
                      emphasis="today"
                      done={completed.has(day.id)}
                      disabled={playDisabled}
                      onPlay={() => startDay(day.id)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <Text className="mt-4 text-sm text-ink-400">
                {next
                  ? t('training.restDay', { next: scheduleLabel(next.day) ?? '' })
                  : t('training.noSchedule')}
              </Text>
            )}

            {otherSplits.length ? (
              <>
                <Text className="mb-2 mt-5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
                  {todaySplits.length ? t('training.otherSplits') : t('editor.splits')}
                </Text>
                <View className="gap-2">
                  {otherSplits.map((day) => (
                    <SplitRow
                      key={day.id}
                      name={dayDisplayName(day, t)}
                      label={scheduleLabel(day)}
                      emphasis="other"
                      done={completed.has(day.id)}
                      disabled={playDisabled}
                      onPlay={() => startDay(day.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <View className="mt-5">
              <HoldButton
                size="sm"
                label={t('training.holdAbandon')}
                disabled={playDisabled}
                onComplete={abandon}
              />
            </View>
          </Card>
        </FadeInUp>
      ) : null}

      {ownVisible.length ? (
        <>
          <SectionLabel label={t('training.yourPrograms')} className="mt-6" />
          <View className="gap-3">
            {ownVisible.map((p, i) => (
              <FadeInUp key={p.id} delay={i * 60}>
                <ProgramCard program={p} />
              </FadeInUp>
            ))}
          </View>
        </>
      ) : null}

      {recommendedVisible.length ? (
        <>
          <SectionLabel
            label={t('training.recommended')}
            icon={<SparksIcon color={brand} size={14} />}
            className="mt-6"
          />
          <View className="gap-3">
            {recommendedVisible.map((p, i) => (
              <FadeInUp key={p.id} delay={i * 60}>
                <ProgramCard program={p} />
              </FadeInUp>
            ))}
          </View>
        </>
      ) : null}

      <View className="mt-6 gap-3">
        <PressableScale onPress={() => router.push('/training/edit/new')}>
          <Card className="flex-row items-center border-brand/30 bg-brand/10">
            <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-brand/15">
              <PlusIcon color={brand} size={22} />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-base font-sans-semibold text-ink-50">
                {t('editor.createOwn')}
              </Text>
              <Text className="mt-0.5 text-sm text-ink-400">{t('editor.createOwnSub')}</Text>
            </View>
            <ChevronRightIcon color={brand} />
          </Card>
        </PressableScale>
      </View>

      {/* Around the session: the work most people skip, one tap from the plan. */}
      <SectionLabel label={t('warmup.title')} className="mt-6" />
      <PressableScale onPress={() => router.push('/training/warmups')}>
        <Card className="flex-row items-center">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-field bg-ink-800">
            <SparksIcon color={muted} size={20} />
          </View>
          <View className="flex-1 pr-2">
            <Text className="text-base font-sans-semibold text-ink-50">{t('warmup.sub')}</Text>
            <Text className="mt-0.5 text-sm text-ink-400" numberOfLines={2}>
              {t('warmup.trainHint')}
            </Text>
          </View>
          <ChevronRightIcon color={muted} />
        </Card>
      </PressableScale>
      <BlockingOverlay
        visible={busy !== null}
        label={busy === 'abandoning' ? t('training.abandoning') : t('training.startingWorkout')}
      />
    </Screen>
  );
};

export default Training;
