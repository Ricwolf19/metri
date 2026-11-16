import { useLiveQuery } from '@/db/useLiveQuery';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import { BlockingOverlay, Button, Card, Screen, useDialog, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { WeekdayChips } from '@/features/training/components/WeekdayChips';
import {
  StartValidationError,
  abandonEnrollment,
  activeEnrollmentQuery,
  enrollInProgram,
} from '@/features/training/enroll';
import { db } from '@/db/client';
import { WEEKDAY_KEY, dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { getProgram, getProgramTree } from '@/features/training/programs.repo';
import { syncTrainingReminder } from '@/features/training/reminders';
import {
  isPickComplete,
  isScheduleComplete,
  scheduleFromPicks,
  splitCounts,
  suggestWeekdays,
  validateProgramForStart,
  type StartProblem,
} from '@/features/training/schedule';
import { useI18n, useT, type TFunction } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { useBlockingTask } from '@/lib/useBlockingTask';

const problemText = (t: TFunction, p: StartProblem): string => {
  switch (p.kind) {
    case 'no_phases':
      return t('start.problem.noPhases');
    case 'phase_no_splits':
      return t('start.problem.phaseNoSplits', {
        phase: routineDisplayName({ name: p.routineName, orderIndex: p.routineOrder }, t),
      });
    case 'split_no_exercises':
      return t('start.problem.splitNoExercises', {
        phase: routineDisplayName({ name: p.routineName, orderIndex: p.routineOrder }, t),
        split: dayDisplayName({ name: p.dayName, orderIndex: p.dayOrder }, t),
      });
  }
};

const problemHref = (programId: string, p: StartProblem): Href => {
  switch (p.kind) {
    case 'no_phases':
      return { pathname: '/training/edit/program/[id]', params: { id: programId } };
    case 'phase_no_splits':
      return { pathname: '/training/edit/routine/[id]', params: { id: p.routineId } };
    case 'split_no_exercises':
      return { pathname: '/training/edit/day/[id]', params: { id: p.dayId } };
  }
};

/**
 * Start flow: first the structural check (with deep links to fix each
 * problem), then the training DAYS — one pick per splits-a-week count the
 * phases use (three days, four…), never a day and an hour for every split of
 * every phase. Each pick opens on the conventional pattern (`suggestWeekdays`),
 * so a lifter can start on one tap; every phase with that count takes those
 * days in split order (`scheduleFromPicks`). The hour is not part of the plan.
 */
const StartProgram = () => {
  const { id, switch: switching } = useLocalSearchParams<{ id: string; switch?: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const programId = typeof id === 'string' ? id : '';

  const [program] = useState(() => (programId ? getProgram(programId) : null));
  const [tree, setTree] = useState(() => getProgramTree(programId));
  const [problems, setProblems] = useState<StartProblem[]>(() => validateProgramForStart(tree));
  // Only the counts the lifter changed; the rest stay on the suggestion, which
  // also covers a count a "Fix" round trip just added.
  const [picked, setPicked] = useState<Record<number, number[]>>({});
  const blocking = useBlockingTask<'starting'>();

  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''), [user?.id]);
  const enrollment = enrollments[0] ?? null;

  // Re-validate on every focus: the user comes back here after a "Fix" round trip.
  useFocusEffect(
    useCallback(() => {
      const next = getProgramTree(programId);
      setTree(next);
      setProblems(validateProgramForStart(next));
    }, [programId]),
  );

  if (!user || !program || !programId) return <Redirect href="/training" />;

  const counts = splitCounts(tree);
  const pickFor = (count: number): number[] => picked[count] ?? suggestWeekdays(count);
  const picks = Object.fromEntries(counts.map((n) => [n, pickFor(n)]));
  const entries = scheduleFromPicks(tree, picks);
  const weekdayOf = new Map(entries.map((e) => [e.dayId, e.weekday]));
  const complete =
    counts.every((n) => isPickComplete(n, pickFor(n))) && isScheduleComplete(tree, entries);

  /** Toggle a day; a full pick takes no more until one is dropped. */
  const toggleDay = (count: number, weekday: number) => {
    const current = pickFor(count);
    const next = current.includes(weekday)
      ? current.filter((w) => w !== weekday)
      : current.length < Math.min(count, 7)
        ? [...current, weekday]
        : current;
    setPicked((prev) => ({ ...prev, [count]: next }));
  };

  // One transaction: switching must never leave the user with no program. The
  // overlay runs it once it is on screen — in the same tick, it never showed.
  const doStart = () =>
    blocking.start('starting', () => {
      try {
        db.transaction(() => {
          if (enrollment) abandonEnrollment(enrollment.id);
          enrollInProgram(user.id, programId, entries, locale);
        });
        void syncTrainingReminder(user.id, { enable: true });
        toast.success(t('training.enrolledToast'));
        router.dismissTo('/training');
      } catch (e) {
        if (e instanceof StartValidationError) {
          setProblems(e.problems);
          return;
        }
        captureError(e);
        toast.error(t('start.failed'));
      }
    });
  const confirm = () => {
    if (enrollment && (switching === '1' || enrollment.programId !== programId)) {
      dialog.confirm({
        title: t('training.switchConfirm'),
        confirmLabel: t('training.switch'),
        onConfirm: doStart,
      });
      return;
    }
    doStart();
  };

  const header = (
    <TopBar
      showBack
      showAvatar={false}
      title={program.name}
      subtitle={problems.length ? t('start.problemsTitle') : t('start.scheduleTitle')}
    />
  );

  if (problems.length) {
    return (
      <Screen scroll edges={['top']} contentClassName="px-5 pb-10" header={header}>
        <Text className="mb-4 text-sm leading-6 text-ink-300">{t('start.problemsBody')}</Text>
        <View className="gap-3">
          {problems.map((p, i) => (
            <Card key={`${p.kind}-${i}`} className="flex-row items-center">
              <Text className="flex-1 pr-3 text-sm leading-5 text-ink-100">
                {problemText(t, p)}
              </Text>
              <Button
                size="sm"
                fullWidth={false}
                label={t('editor.edit')}
                onPress={() => router.push(problemHref(programId, p))}
              />
            </Card>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={['top']}
      contentClassName="px-5 pb-10"
      header={header}
      footer={
        <Button variant="brand" label={t('start.confirm')} disabled={!complete} onPress={confirm} />
      }
    >
      <Text className="mb-3 text-sm leading-6 text-ink-300">{t('start.scheduleBody')}</Text>

      {counts.map((count) => {
        const phases = tree.routines.filter((r) => r.days.length === count);
        const days = pickFor(count);
        // What the pick means, on the first phase that uses it.
        const sample = [...(phases[0]?.days ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
        return (
          <Card key={count} className="mb-4">
            <Text className="text-base font-sans-semibold text-ink-50">
              {t('start.daysPerWeek', { count })}
            </Text>
            <Text className="mt-0.5 text-xs leading-5 text-ink-400">
              {phases.length === tree.routines.length
                ? t('start.everyPhase')
                : phases.map((r) => routineDisplayName(r, t)).join(' · ')}
            </Text>
            <View className="mt-3">
              <WeekdayChips selected={days} onPress={(weekday) => toggleDay(count, weekday)} />
            </View>
            <Text className="mt-2 text-xs text-ink-400">
              {t('start.daysPicked', { n: days.length, total: Math.min(count, 7) })}
            </Text>
            {isPickComplete(count, days) ? (
              <View className="mt-3 gap-1.5 border-t border-ink-700 pt-3">
                {sample.map((day) => {
                  const weekday = weekdayOf.get(day.id);
                  return (
                    <View key={day.id} className="flex-row items-center">
                      <Text
                        numberOfLines={1}
                        className="w-28 shrink-0 font-mono-medium text-xs uppercase tracking-wider text-brand"
                      >
                        {weekday == null ? '—' : t(WEEKDAY_KEY[weekday])}
                      </Text>
                      <Text className="min-w-0 flex-1 text-sm text-ink-100" numberOfLines={1}>
                        {dayDisplayName(day, t)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </Card>
        );
      })}
      <Text className="mt-1 text-xs leading-5 text-ink-500">{t('start.timeHint')}</Text>
      <BlockingOverlay
        visible={blocking.busy !== null}
        onShow={blocking.onShow}
        label={t('start.starting')}
      />
    </Screen>
  );
};

export default StartProgram;
