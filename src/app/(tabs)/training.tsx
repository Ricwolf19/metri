import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import type { SkipReason, WorkoutStatus } from '@/db/schema';

import {
  ChevronRightIcon,
  HistoryIcon,
  PlayIcon,
  PlusIcon,
  ShareIcon,
  SparksIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  BlockingOverlay,
  Card,
  FadeInUp,
  HoldButton,
  IconButton,
  PressableScale,
  Screen,
  Sheet,
  Skeleton,
  useDialog,
  useToast,
  SectionLabel,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { isRmTestWeek } from '@/features/training/progression';
import { routineShareModel, type ShareModel } from '@/features/share/models';
import { ShareSheet } from '@/features/share/ShareSheet';
import { slotsQuery } from '@/features/training/authoring.repo';
import { ProgramCard } from '@/features/training/components/ProgramCard';
import { presetProgramCopy } from '@/features/training/programs';
import { SkipReasonChips } from '@/features/training/components/SkipReasonChips';
import { SplitRow } from '@/features/training/components/SplitRow';
import { abandonEnrollment, setEnrollmentPosition } from '@/features/training/enroll';
import {
  WEEKDAY_KEY,
  dayDisplayName,
  exerciseDisplayName,
  routineDisplayName,
} from '@/features/training/labels';
import { ownProgramsQuery, recommendedProgramsQuery } from '@/features/training/programs.repo';
import { syncTrainingReminder } from '@/features/training/reminders';
import { skipSplitFromPlan } from '@/features/training/skip-split';
import {
  formatClockTime,
  nextScheduledSplit,
  splitsForWeekday,
  weekdayOfDate,
  type ScheduledDay,
} from '@/features/training/schedule';
import {
  activeWorkoutQuery,
  completedDaysQuery,
  startWorkout,
} from '@/features/training/session.repo';
import { useEnrollment } from '@/features/training/useEnrollment';
import { useI18n, useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';
import { useSpotlight } from '@/features/spotlight/SpotlightProvider';
import { useTheme } from '@/theme/theme-context';

// Lets the overlay paint before the synchronous write.
const OVERLAY_PAINT_MS = 50;

/** Train tab: active program (today's splits + Play) first, then own programs, curated presets, create. */
const Training = () => {
  const router = useRouter();
  const t = useT();
  const spotlight = useSpotlight();
  const { locale } = useI18n();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand, muted } = useTheme();
  const clock = useClockFormat();
  const userId = user?.id ?? '';

  // Arriving from a finished session: hold the wait the workout screen was
  // already showing until this tab has its data, so the hand-off is one screen
  // rather than a flash of a half-built list.
  const { settling } = useLocalSearchParams<{ settling?: string }>();
  const [settled, setSettled] = useState(settling !== '1');

  const { enrollment, structure, loaded } = useEnrollment(userId);
  const { data: actives } = useLiveQuery(activeWorkoutQuery(userId), [userId]);
  const { data: recommended } = useLiveQuery(recommendedProgramsQuery());
  const { data: own } = useLiveQuery(ownProgramsQuery(userId), [userId]);
  const activeWorkout = actives[0] ?? null;
  // Live, so a session deleted from the history un-greys its split on return.
  const { data: completedRows } = useLiveQuery(
    completedDaysQuery(enrollment?.id ?? '', enrollment?.currentWeek ?? 0),
    [enrollment?.id, enrollment?.currentWeek],
  );

  if (!settled && loaded) setSettled(true);

  // Snapshot on focus: an overnight tab shows the right day without a clock read in render.
  const [busy, setBusy] = useState<'starting' | 'abandoning' | null>(null);
  // The split being skipped: a reason is asked in a sheet, then the plan moves on.
  const [skipping, setSkipping] = useState<ScheduledDay | null>(null);
  // The plan as a card: built when asked for, from the current phase's splits.
  const [planShare, setPlanShare] = useState<ShareModel | null>(null);
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
  const resolvedStatus = new Map<string, WorkoutStatus>(
    completedRows.map((r) => [r.dayId, r.status]),
  );
  const resolvedAs = (dayId: string): 'done' | 'skipped' | null => {
    const status = resolvedStatus.get(dayId);
    return status === 'completed' ? 'done' : status === 'skipped' ? 'skipped' : null;
  };

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

  // A split the plan already counts as resolved can still be trained, but not
  // by accident: a skipped one asks a different question than a finished one.
  const startDay = (dayId: string) => {
    const resolved = resolvedAs(dayId);
    if (!resolved) return begin(dayId);
    const skipped = resolved === 'skipped';
    dialog.confirm({
      title: t(skipped ? 'training.redoSkippedTitle' : 'training.redoTitle'),
      message: t(skipped ? 'training.redoSkippedBody' : 'training.redoBody'),
      confirmLabel: t('training.redoConfirm'),
      onConfirm: () => begin(dayId),
    });
  };

  const sharePlan = () => {
    if (!structure?.program) return;
    setPlanShare(
      routineShareModel({
        programName:
          presetProgramCopy(structure.program.id, locale)?.name ?? structure.program.name,
        phaseLine: [
          structure.currentRoutine ? routineDisplayName(structure.currentRoutine, t) : null,
          t('training.weekOf', { week: structure.programWeek, total: structure.totalWeeks }),
        ]
          .filter(Boolean)
          .join(' · '),
        days: days.map((d) => ({
          name: dayDisplayName(d, t),
          exercises: slotsQuery(d.id)
            .all()
            .map((r) => ({ id: r.exercise.id, name: exerciseDisplayName(r.exercise, locale) })),
        })),
        t,
      }),
    );
  };

  const skip = (reason: SkipReason | null) => {
    if (!enrollment || !skipping) return;
    skipSplitFromPlan(user.id, enrollment, skipping, reason);
    setSkipping(null);
    toast.info(t('training.skippedToast'));
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
      onPullHold={spotlight?.open}
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
            <View className="flex-row items-start">
              <Text className="flex-1 pr-2 text-xl font-sans-bold text-ink-50">
                {presetProgramCopy(structure.program.id, locale)?.name ?? structure.program.name}
              </Text>
              <IconButton
                icon={<ShareIcon color={muted} size={16} />}
                onPress={sharePlan}
                accessibilityLabel={t('share.routine')}
              />
            </View>
            <Text className="mt-0.5 text-sm text-ink-400">
              {structure.currentRoutine
                ? `${routineDisplayName(structure.currentRoutine, t)} · `
                : ''}
              {t('training.weekOf', { week: structure.programWeek, total: structure.totalWeeks })}
            </Text>
            {/* The block's test week: informational (sky), a tap opens the guide on how. */}
            {isRmTestWeek(structure.currentRoutine, enrollment.currentWeek) ? (
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/docs/[id]', params: { id: 'when-to-test-rm' } })
                }
                accessibilityRole="button"
                className="mt-2 self-start rounded-full border border-info/30 bg-info/10 px-3 py-1"
              >
                <Text className="text-xs font-sans-semibold text-info">
                  {t('training.rmTestWeek')}
                </Text>
              </PressableScale>
            ) : null}

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
                      resolved={resolvedAs(day.id)}
                      disabled={playDisabled}
                      onPlay={() => startDay(day.id)}
                      onSkip={() => setSkipping(day)}
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
                      resolved={resolvedAs(day.id)}
                      disabled={playDisabled}
                      onPlay={() => startDay(day.id)}
                      onSkip={() => setSkipping(day)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <PressableScale onPress={() => router.push('/training/history')}>
              <View className="mt-5 flex-row items-center rounded-field border border-ink-700 bg-ink-850 py-3 pl-4 pr-3">
                <HistoryIcon color={muted} size={18} />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-sans-semibold text-ink-50">
                    {t('training.sessions')}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-400">{t('training.sessionsSub')}</Text>
                </View>
                <ChevronRightIcon color={muted} size={18} />
              </View>
            </PressableScale>

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
      {/* "Not this week": the reason is the whole form, the plan moves on at once. */}
      <Sheet visible={skipping !== null} onClose={() => setSkipping(null)}>
        {/* Sheet content keeps the screen's 20-px gutter (`ScrollArea inSheet` does the same). */}
        <View className="px-5 pb-6">
          <Text className="text-lg font-sans-bold text-ink-50">{t('training.skipSplit')}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-400">{t('training.skipSplitHint')}</Text>
          <SkipReasonChips onPick={skip} />
        </View>
      </Sheet>
      <ShareSheet
        visible={planShare !== null}
        onClose={() => setPlanShare(null)}
        model={planShare}
      />
      <BlockingOverlay
        visible={busy !== null || !settled}
        label={
          busy === 'abandoning'
            ? t('training.abandoning')
            : busy === 'starting'
              ? t('training.startingWorkout')
              : t('training.finishing')
        }
      />
    </Screen>
  );
};

export default Training;
