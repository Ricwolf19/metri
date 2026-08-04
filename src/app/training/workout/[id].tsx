import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { CheckIcon, FlameIcon, PlusIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  Screen,
  ScreenTitle,
  SegmentedControl,
  useDialog,
  type Segment,
} from '@/components/ui';
import type { PlannedSlot, SetGroup, SetLog } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { lbToKg } from '@/features/bmr/calc';
import { fromKg } from '@/features/training/progression';
import { RestTimer } from '@/features/training/components/RestTimer';
import { getExercise } from '@/features/training/exercises.repo';
import { getWorkoutDay } from '@/features/training/programs.repo';
import {
  abandonWorkout,
  finishWorkout,
  deleteSet,
  getWorkout,
  lastWeekSets,
  logSet,
  sessionSummary,
  setLogsQuery,
  suggestedWeight,
  swapSnapshotExercise,
  type SessionSummary,
} from '@/features/training/session.repo';
import { useT, type TFunction } from '@/i18n';
import { settings, type Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

/** One planned set row, expanded from the snapshot's set groups. */
type PlannedRow = {
  groupLabel: string | null;
  reps: number;
  repsMax?: number;
};

const groupIntensity = (g: SetGroup, t: TFunction): string => {
  if (g.toFailure) return t('training.failure');
  if (g.rirMin == null && g.rirMax == null) return '';
  if (g.rirMax == null || g.rirMin === g.rirMax) return `RIR ${g.rirMin ?? g.rirMax}`;
  if (g.rirMin == null) return `RIR ${g.rirMax}`;
  return `RIR ${g.rirMin}-${g.rirMax}`;
};

const expandRows = (groups: SetGroup[], t: TFunction): PlannedRow[] => {
  const multi = groups.length > 1;
  return groups.flatMap((g, gi) => {
    const intensity = groupIntensity(g, t);
    const base = multi ? (gi === 0 ? t('training.topSet') : t('training.backOff')) : null;
    const label = [base, intensity].filter(Boolean).join(' · ') || null;
    return Array.from({ length: g.sets }, () => ({
      groupLabel: label,
      reps: g.reps,
      repsMax: g.repsMax,
    }));
  });
};

const fmtDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

type RowProps = {
  index: number;
  row: PlannedRow | null; // null = extra set beyond the plan
  logged: SetLog | null;
  active: boolean;
  unit: Units;
  prefill: { weightKg: number | null; reps: number };
  onLog: (weightKg: number, reps: number, opts: { rir: number | null; failure: boolean }) => void;
};

/** A single set row: compact confirmed line when done, inputs + big ✓ when
 * pending. The ACTIVE row also shows the round-step adjust strip (±5 / ±1) —
 * fine-grained loads are typed directly into the input. */
const SetRow = ({ index, row, logged, active, unit, prefill, onLog }: RowProps) => {
  const t = useT();
  const [weight, setWeight] = useState(() =>
    prefill.weightKg != null ? String(fromKg(prefill.weightKg, unit)) : '',
  );
  const [reps, setReps] = useState(() => String(prefill.reps));
  const [rir, setRir] = useState('');
  const [failure, setFailure] = useState(false);

  if (logged) {
    return (
      <View className="flex-row items-center rounded-lg bg-ink-850 px-3 py-2">
        <View className="mr-3 h-5 w-5 items-center justify-center rounded-full bg-brand">
          <CheckIcon color="#08090d" size={13} />
        </View>
        <Text className="w-8 text-xs font-sans-semibold text-ink-400">{index + 1}</Text>
        <Text className="flex-1 text-sm font-sans-medium text-ink-100">
          {fromKg(logged.weightKg, unit)} {unit} × {logged.reps}
          {logged.rir != null ? ` · RIR ${logged.rir}` : ''}
          {logged.isFailure ? ` · ${t('training.failure')}` : ''}
        </Text>
        <Pressable hitSlop={8} onPress={() => deleteSet(logged.id)} accessibilityRole="button">
          <XIcon color="#71717a" size={15} />
        </Pressable>
      </View>
    );
  }

  const bump = (field: 'w' | 'r', delta: number) => {
    if (field === 'w') {
      const current = Number(weight) || 0;
      setWeight(String(Math.max(0, Math.round((current + delta) * 10) / 10)));
    } else {
      const current = Number(reps) || 0;
      setReps(String(Math.max(1, current + delta)));
    }
  };

  const confirm = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (weight === '' || Number.isNaN(w) || w < 0 || !(r > 0)) return;
    const rirNum = rir === '' ? null : Number(rir);
    onLog(unit === 'lb' ? lbToKg(w) : w, r, {
      rir: rirNum != null && Number.isFinite(rirNum) ? rirNum : null,
      failure,
    });
  };

  return (
    <View
      className={[
        'rounded-lg px-3 py-2',
        active ? 'border border-brand/30 bg-ink-850' : 'bg-ink-850/50',
      ].join(' ')}
    >
      {row?.groupLabel ? (
        <Text className="mb-1 font-mono-medium text-[10px] uppercase tracking-wider text-brand">
          {row.groupLabel}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Text className="w-8 text-xs font-sans-semibold text-ink-400">{index + 1}</Text>
        <View className="flex-1">
          <Input
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={unit}
            maxLength={6}
          />
        </View>
        <View className="w-20">
          <Input
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder={row ? `${row.reps}${row.repsMax ? `-${row.repsMax}` : ''}` : '0'}
            maxLength={3}
          />
        </View>
        <Pressable
          onPress={confirm}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color="#08090d" size={22} />
        </Pressable>
      </View>

      {active ? (
        <View className="mt-2 flex-row items-center gap-2">
          {[
            { label: '-5', act: () => bump('w', -5) },
            { label: '+5', act: () => bump('w', +5) },
          ].map(({ label, act }) => (
            <Pressable
              key={label}
              onPress={act}
              className="h-9 flex-1 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <Text className="text-xs font-sans-semibold text-ink-200">{label}</Text>
            </Pressable>
          ))}
          <View className="w-px self-stretch bg-ink-700" />
          {[
            { label: '-1', act: () => bump('r', -1) },
            { label: '+1', act: () => bump('r', +1) },
          ].map(({ label, act }) => (
            <Pressable
              key={label}
              onPress={act}
              className="h-9 flex-1 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <Text className="text-xs font-sans-semibold text-ink-200">{label}</Text>
            </Pressable>
          ))}
          <View className="w-px self-stretch bg-ink-700" />
          <View className="w-14">
            <Input
              value={rir}
              onChangeText={setRir}
              keyboardType="number-pad"
              placeholder="RIR"
              maxLength={2}
            />
          </View>
          <Pressable
            onPress={() => setFailure((f) => !f)}
            accessibilityRole="button"
            accessibilityState={{ selected: failure }}
            className={[
              'h-9 w-9 items-center justify-center rounded-field border',
              failure ? 'border-red-400/50 bg-red-500/15' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <FlameIcon color={failure ? '#f87171' : '#71717a'} size={16} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

type CardProps = {
  workoutLogId: string;
  planned: PlannedSlot;
  sets: SetLog[];
  unit: Units;
  lastWeek: SetLog[];
  onLogged: (restSeconds: number) => void;
};

const ExerciseCard = ({ workoutLogId, planned, sets, unit, lastWeek, onLogged }: CardProps) => {
  const t = useT();
  const router = useRouter();
  const dialog = useDialog();
  const { brand } = useTheme();
  const [extraRows, setExtraRows] = useState(0);

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const doneCount = working.length;
  const totalRows = Math.max(rows.length, doneCount) + extraRows;

  const suggested = useMemo(
    () => suggestedWeight(planned.exerciseId, rows[0]?.reps ?? 8, 2),
    [planned.exerciseId, rows],
  );

  const prefillFor = (i: number): { weightKg: number | null; reps: number } => {
    const prior = lastWeek[i] ?? lastWeek[lastWeek.length - 1];
    if (prior) return { weightKg: prior.weightKg, reps: rows[i]?.reps ?? prior.reps };
    return { weightKg: suggested, reps: rows[i]?.reps ?? 8 };
  };

  const pickAlternative = () => {
    if (!planned.alternativeExerciseIds.length) return;
    const options = planned.alternativeExerciseIds
      .map((altId) => getExercise(altId))
      .filter((e): e is NonNullable<typeof e> => !!e);
    dialog.show({
      title: t('training.alternatives'),
      actions: [
        ...options.map((e) => ({
          label: e.name,
          onPress: () => swapSnapshotExercise(workoutLogId, planned.slotId, e.id, e.name),
        })),
        { label: t('common.cancel'), style: 'cancel' as const },
      ],
    });
  };

  const lastWeekLine = lastWeek.length
    ? `${t('training.lastWeek')}: ${fromKg(lastWeek[0].weightKg, unit)}${unit} × ${lastWeek
        .map((s) => s.reps)
        .join(',')}`
    : null;

  return (
    <Card className="mb-3">
      <Pressable
        onPress={() =>
          router.push({ pathname: '/training/exercise/[id]', params: { id: planned.exerciseId } })
        }
        onLongPress={pickAlternative}
        accessibilityRole="button"
      >
        <Text className="text-base font-sans-semibold text-ink-50">{planned.name}</Text>
        {planned.alternativeExerciseIds.length ? (
          <Text className="mt-0.5 text-[11px] text-ink-500">{t('training.holdForAlt')}</Text>
        ) : null}
      </Pressable>

      {planned.badges.length ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {planned.badges.map((b, i) => (
            <View key={`${b}-${i}`} className="rounded-full bg-ink-800 px-2.5 py-1">
              <Text className="font-mono-medium text-[10px] uppercase tracking-wide text-ink-300">
                {b}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {lastWeekLine ? <Text className="mt-2 text-xs text-ink-400">{lastWeekLine}</Text> : null}

      <View className="mt-3 gap-1.5">
        {Array.from({ length: totalRows }, (_, i) => (
          <SetRow
            // Key by logged id when done so React reuses input state correctly.
            key={working[i]?.id ?? `row-${i}`}
            index={i}
            row={rows[i] ?? null}
            logged={working[i] ?? null}
            active={i === doneCount}
            unit={unit}
            prefill={prefillFor(i)}
            onLog={(weightKg, reps, opts) => {
              logSet({
                workoutLogId,
                exerciseId: planned.exerciseId,
                weightKg,
                reps,
                rir: opts.rir,
                isFailure: opts.failure,
              });
              onLogged(planned.restSeconds ?? 120);
            }}
          />
        ))}
      </View>

      <Pressable
        onPress={() => setExtraRows((n) => n + 1)}
        accessibilityRole="button"
        className="mt-2 flex-row items-center justify-center gap-1 py-1.5"
      >
        <PlusIcon color={brand} size={14} />
        <Text className="text-xs font-sans-semibold text-brand">{t('training.extraSet')}</Text>
      </Pressable>
    </Card>
  );
};

const WorkoutSession = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const dialog = useDialog();
  const { user } = useAuth();
  useKeepAwake();

  const log = typeof id === 'string' ? getWorkout(id) : null;
  const workoutDayId = log?.workoutDayId ?? null;
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [rest, setRest] = useState<{ key: number; seconds: number; endsAtLabel: string } | null>(
    null,
  );
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const day = workoutDayId ? getWorkoutDay(workoutDayId) : null;
  const { data: sets } = useLiveQuery(setLogsQuery(typeof id === 'string' ? id : ''));

  // Prefill source: last week's sets per snapshot slot (stable per session).
  const lastWeekBySlot = useMemo(() => {
    if (!log?.plannedSnapshot || !workoutDayId) return new Map<string, SetLog[]>();
    return new Map(
      log.plannedSnapshot.map((p) => [
        p.slotId,
        lastWeekSets(p.exerciseId, workoutDayId, log.weekNumber - 1),
      ]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.id]);

  if (!user || !log || log.status !== 'in_progress') return <Redirect href="/training" />;

  const planned = log.plannedSnapshot ?? [];
  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);

  // End-time label computed when the rest STARTS (an event, not render — the
  // compiler rightly rejects reading the clock during render).
  const onLogged = (restSeconds: number) => {
    const d = new Date(Date.now() + restSeconds * 1000);
    const endsAtLabel = `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}:${`${d.getSeconds()}`.padStart(2, '0')}`;
    setRest((prev) => ({ key: (prev?.key ?? 0) + 1, seconds: restSeconds, endsAtLabel }));
  };

  const finish = () => setSummary(sessionSummary(log.id));

  const closeSummary = () => {
    finishWorkout(log.id);
    setSummary(null);
    router.replace('/training');
  };

  const cancel = () =>
    dialog.show({
      title: t('training.cancelConfirm'),
      actions: [
        { label: t('common.cancel'), style: 'cancel' },
        {
          label: t('training.cancelWorkout'),
          style: 'destructive',
          onPress: () => {
            abandonWorkout(log.id);
            router.replace('/training');
          },
        },
      ],
    });

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          right={
            <Pressable
              hitSlop={8}
              onPress={cancel}
              accessibilityRole="button"
              accessibilityLabel={t('training.cancelWorkout')}
              className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
            >
              <XIcon color="#ef4444" size={18} />
            </Pressable>
          }
        />
      }
    >
      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-2"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title={day?.name ?? t('training.workout')}
          subtitle={t('training.weekN', { n: log.weekNumber })}
        />

        {/* Units ride the scroll: a set-and-forget control, not worth pinning. */}
        <View className="mb-4 w-32">
          <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={setUnit} />
        </View>

        {planned.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('training.empty')}</Text>
        ) : (
          planned.map((p) => (
            <ExerciseCard
              key={p.slotId}
              workoutLogId={log.id}
              planned={p}
              sets={setsFor(p.exerciseId)}
              unit={unit}
              lastWeek={lastWeekBySlot.get(p.slotId) ?? []}
              onLogged={onLogged}
            />
          ))
        )}
      </KeyboardAwareScrollView>

      <View className="gap-3 px-5 pb-2 pt-3">
        {rest ? (
          <RestTimer
            key={rest.key}
            seconds={rest.seconds}
            label={t('training.rest')}
            skipLabel={t('training.skip')}
            notifyTitle={t('training.restDoneTitle')}
            notifyBody={t('training.restDoneBody')}
            ongoingTitle={t('training.restOngoingTitle')}
            ongoingBody={t('training.restOngoingBody', { time: rest.endsAtLabel })}
            onDone={() => setRest(null)}
          />
        ) : null}
        <Button
          label={t('training.finish')}
          leftIcon={<CheckIcon color="#09090b" size={18} />}
          onPress={finish}
        />
      </View>

      {/* Post-workout summary */}
      <Modal
        visible={summary !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSummary}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-8">
          <View className="w-full rounded-card border border-ink-700 bg-ink-850 p-6">
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
                <CheckIcon color="#08090d" size={28} />
              </View>
              <Text className="mt-4 text-xl font-sans-bold text-ink-50">
                {t('training.summaryTitle')}
              </Text>
            </View>
            {summary ? (
              <View className="mt-5 gap-2.5">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-ink-400">{t('training.summaryVolume')}</Text>
                  <Text className="text-sm font-sans-semibold text-ink-100">
                    {fromKg(summary.volumeKg, unit)} {unit}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-ink-400">{t('training.summarySets')}</Text>
                  <Text className="text-sm font-sans-semibold text-ink-100">
                    {summary.setCount}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-ink-400">{t('training.summaryDuration')}</Text>
                  <Text className="text-sm font-sans-semibold text-ink-100">
                    {fmtDuration(summary.durationSeconds)}
                  </Text>
                </View>
                {summary.prs.length ? (
                  <View className="mt-1 rounded-field bg-brand/10 p-3">
                    <Text className="text-xs font-sans-semibold text-brand">
                      {t('training.summaryPrs')}: {summary.prs.join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <View className="mt-6">
              <Button label={t('training.summaryDone')} variant="brand" onPress={closeSummary} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

export default WorkoutSession;
