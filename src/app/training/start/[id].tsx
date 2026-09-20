import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TopBar } from '@/components/TopBar';
import {
  BlockingOverlay,
  Button,
  Card,
  Screen,
  SectionLabel,
  useDialog,
  useToast,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  DEFAULT_START_MINUTE,
  StartTimeField,
} from '@/features/training/components/StartTimeField';
import { WeekdayChips } from '@/features/training/components/WeekdayChips';
import {
  StartValidationError,
  abandonEnrollment,
  activeEnrollmentQuery,
  enrollInProgram,
} from '@/features/training/enroll';
import { db } from '@/db/client';
import { dayDisplayName, routineDisplayName } from '@/features/training/labels';
import { getProgram, getProgramTree } from '@/features/training/programs.repo';
import { syncTrainingReminder } from '@/features/training/reminders';
import {
  formatClockTime,
  isScheduleComplete,
  prefillSchedule,
  suggestWeekdays,
  validateProgramForStart,
  type ScheduleEntry,
  type StartProblem,
} from '@/features/training/schedule';
import { useI18n, useT, type TFunction } from '@/i18n';
import { captureError } from '@/lib/telemetry';
import { useClockFormat } from '@/lib/useClockFormat';

/** Common gym slots, in minutes from midnight. */
const QUICK_TIMES = [7 * 60, 12 * 60, 18 * 60, 20 * 60];

type DraftEntry = { weekday?: number; startMinute?: number };

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
 * problem), then a weekday + time for every split of every phase. Later
 * phases mirror phase 1 until the user touches them.
 */
const StartProgram = () => {
  const { id, switch: switching } = useLocalSearchParams<{ id: string; switch?: string }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useI18n();
  const toast = useToast();
  const dialog = useDialog();
  const { user } = useAuth();
  const clock = useClockFormat();
  const programId = typeof id === 'string' ? id : '';

  const [program] = useState(() => (programId ? getProgram(programId) : null));
  const [tree, setTree] = useState(() => getProgramTree(programId));
  const [problems, setProblems] = useState<StartProblem[]>(() => validateProgramForStart(tree));
  const [partial, setDraftEntry] = useState<Record<string, DraftEntry>>({});
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [openTime, setOpenTime] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(user?.id ?? ''));
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

  const direct: ScheduleEntry[] = Object.entries(partial).flatMap(([dayId, p]) =>
    p.weekday != null && p.startMinute != null
      ? [{ dayId, weekday: p.weekday, startMinute: p.startMinute }]
      : [],
  );
  const entries = prefillSchedule(tree, direct, touched);
  const byDay = new Map(entries.map((e) => [e.dayId, e]));
  const complete = isScheduleComplete(tree, entries);

  const valueOf = (dayId: string): DraftEntry => {
    const mirrored = byDay.get(dayId);
    return { ...(mirrored ?? {}), ...(partial[dayId] ?? {}) };
  };
  const edit = (dayId: string, patch: DraftEntry) => {
    setDraftEntry((prev) => {
      const next = { ...prev, [dayId]: { ...valueOf(dayId), ...patch } };
      // A time usually applies to the whole program; spread it to the splits
      // the user has not set by hand, and let them override any of them.
      if (patch.startMinute != null) {
        for (const routine of tree.routines) {
          for (const day of routine.days) {
            if (day.id === dayId || touched.has(day.id)) continue;
            next[day.id] = { ...next[day.id], startMinute: patch.startMinute };
          }
        }
      }
      return next;
    });
    setTouched((prev) => new Set(prev).add(dayId));
  };
  /** One tap for the whole program: the conventional pattern for this many
   * splits, at one time. Every field stays editable afterwards. */
  const quickFill = (startMinute: number) => {
    const next: Record<string, DraftEntry> = {};
    const all = new Set<string>();
    for (const routine of tree.routines) {
      const weekdays = suggestWeekdays(routine.days.length);
      routine.days.forEach((day, i) => {
        const weekday = weekdays[i % weekdays.length];
        if (weekday == null) return;
        next[day.id] = { weekday, startMinute };
        all.add(day.id);
      });
    }
    setDraftEntry(next);
    setTouched(all);
  };

  const toggleTime = (dayId: string) => {
    if (openTime === dayId) {
      setOpenTime(null);
      return;
    }
    if (valueOf(dayId).startMinute == null) edit(dayId, { startMinute: DEFAULT_START_MINUTE });
    setOpenTime(dayId);
  };

  // One transaction: switching must never leave the user with no program.
  const doStart = () => {
    setStarting(true);
    try {
      db.transaction(() => {
        if (enrollment) abandonEnrollment(enrollment.id);
        enrollInProgram(user.id, programId, entries, locale);
      });
      void syncTrainingReminder(user.id, { enable: true });
      toast.success(t('training.enrolledToast'));
      router.replace('/training');
    } catch (e) {
      if (e instanceof StartValidationError) {
        setProblems(e.problems);
        return;
      }
      captureError(e);
      toast.error(t('start.failed'));
    } finally {
      setStarting(false);
    }
  };
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

      {/* One tap sets the whole program; everything below stays editable. */}
      <Card className="mb-5">
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('start.quickFill')}
        </Text>
        <Text className="mt-1 text-xs leading-5 text-ink-500">{t('start.quickFillHint')}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {QUICK_TIMES.map((minutes) => (
            <Pressable
              key={minutes}
              onPress={() => quickFill(minutes)}
              accessibilityRole="button"
              className="rounded-full border border-brand/30 bg-brand/10 px-3.5 py-2"
            >
              <Text className="font-mono-medium text-xs text-brand">
                {formatClockTime(minutes, clock)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {tree.routines.map((routine) => (
        <View key={routine.id} className="mb-6">
          <SectionLabel
            className="mt-0"
            label={routineDisplayName(routine, t)}
            hint={t('training.weeks', { count: routine.durationWeeks })}
          />
          <View className="gap-3">
            {routine.days.map((day) => {
              const v = valueOf(day.id);
              const open = openTime === day.id;
              return (
                <Card key={day.id}>
                  <Text className="mb-3 text-base font-sans-semibold text-ink-50">
                    {dayDisplayName(day, t)}
                  </Text>
                  <WeekdayChips
                    selected={v.weekday == null ? [] : [v.weekday]}
                    onPress={(weekday) => edit(day.id, { weekday })}
                  />
                  <StartTimeField
                    value={v.startMinute ?? null}
                    open={open}
                    onToggle={() => toggleTime(day.id)}
                    onChange={(startMinute) => edit(day.id, { startMinute })}
                  />
                </Card>
              );
            })}
          </View>
        </View>
      ))}
      <BlockingOverlay visible={starting} label={t('start.starting')} />
    </Screen>
  );
};

export default StartProgram;
