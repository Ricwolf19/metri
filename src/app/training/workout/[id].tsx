import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DragHandleIcon,
  FlameIcon,
  ListIcon,
  PlusIcon,
  ViewGridIcon,
  XIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  Card,
  Input,
  ReorderRow,
  Screen,
  ScreenTitle,
  SegmentedControl,
  Sheet,
  useDialog,
  useToast,
  type Segment,
  BlockingOverlay,
} from '@/components/ui';
import type { PlannedSlot, SetGroup, SetLog } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { lbToKg } from '@/features/bmr/calc';
import { fromKg } from '@/features/training/progression';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { RestTimer } from '@/features/training/components/RestTimer';
import { endRest, extendRest, startRest } from '@/features/notifications/rest-notification';
import { ensureNotificationPermission } from '@/features/notifications/service';
import { restState, useActiveRest } from '@/features/training/rest-state';
import { nextSetSummary, type NextSet } from '@/features/training/rest-summary';
import { formatClockTime } from '@/features/training/schedule';
import { dayDisplayName } from '@/features/training/labels';
import { getExercise } from '@/features/training/exercises.repo';
import { visualIdFor } from '@/features/training/exercise-visuals';
import { exerciseHeads, muscleHeadKey, type MuscleHead } from '@/features/training/muscles';
import { getWorkoutDay } from '@/features/training/programs.repo';
import {
  abandonWorkout,
  finishWorkout,
  deleteSet,
  getWorkout,
  lastWeekSets,
  logSet,
  reorderSnapshot,
  sessionSummary,
  setLogsQuery,
  suggestedWeight,
  swapSnapshotExercise,
  type SessionSummary,
} from '@/features/training/session.repo';
import { syncTrainingReminder } from '@/features/training/reminders';
import { warmupRamp } from '@/features/training/warmup';
import { useI18n, useT, type TFunction } from '@/i18n';
import { settings, type Units, type WorkoutLayout } from '@/lib/storage';
import { useClockFormat } from '@/lib/useClockFormat';
import { useTheme } from '@/theme/theme-context';

// Lets the blocking overlay paint before the synchronous finish work.
const OVERLAY_PAINT_MS = 50;

const UNIT_SEGMENTS: Segment<Units>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

/** What the lifter reports after a set; `rir: null` = deliberately skipped. */
type Effort = { rir: number | null; failure: boolean };
type RequestEffort = () => Promise<Effort | null>;

/** One planned set row, expanded from the snapshot's set groups. */
type PlannedRow = {
  groupLabel: string | null;
  reps: number;
  repsMax?: number;
  /** The prescription asks for an effort reading (RIR range or to-failure). */
  wantsEffort: boolean;
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
      wantsEffort: !!(g.toFailure || g.rirMin != null || g.rirMax != null),
    }));
  });
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtDuration = (s: number): string => {
  const m = Math.floor(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/** Ticking session clock, isolated so the 1 s re-render stays in this leaf. */
const ElapsedClock = ({ startedAt }: { startedAt: Date }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const s = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const label = h
    ? `${h}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
    : `${Math.floor(s / 60)}:${pad2(s % 60)}`;
  return <Text className="font-mono-medium text-xs tabular-nums text-ink-300">{label}</Text>;
};

type RowProps = {
  index: number;
  row: PlannedRow | null; // null = extra set beyond the plan
  logged: SetLog | null;
  active: boolean;
  /** Order is enforced: pending rows after the active one render read-only. */
  locked?: boolean;
  unit: Units;
  prefill: { weightKg: number | null; reps: number };
  /** Warm-up rows log to the same table flagged `isWarmup`, and are excluded
   * from volume, PRs, e1RM and progression everywhere downstream. */
  warmup?: boolean;
  requestEffort: RequestEffort;
  onLog: (weightKg: number, reps: number, opts: { rir: number | null; failure: boolean }) => void;
};

/** A single set row: compact confirmed line when done, inputs + big ✓ when
 * active, dimmed plan line while it waits its turn. Effort (RIR / failure) is
 * captured through the shared sheet instead of a free-text input. */
const SetRow = ({
  index,
  row,
  logged,
  active,
  locked,
  unit,
  prefill,
  warmup,
  requestEffort,
  onLog,
}: RowProps) => {
  const t = useT();
  const toast = useToast();
  const [weight, setWeight] = useState(() =>
    prefill.weightKg != null ? String(fromKg(prefill.weightKg, unit)) : '',
  );
  const [reps, setReps] = useState(() => String(prefill.reps));
  const [effort, setEffort] = useState<Effort | null>(null);

  const rowLabel = warmup ? t('training.warmupShort') : String(index + 1);

  if (logged) {
    return (
      <View className="flex-row items-center rounded-field bg-ink-850 px-3 py-2">
        <View
          className={[
            'mr-3 h-5 w-5 items-center justify-center rounded-full',
            warmup ? 'bg-ink-600' : 'bg-brand',
          ].join(' ')}
        >
          <CheckIcon color="#08090d" size={13} />
        </View>
        <Text className="w-8 text-xs font-sans-semibold text-ink-400">{rowLabel}</Text>
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

  // Waiting its turn: show the plan, take no input — sets are done in order.
  if (locked) {
    return (
      <View className="flex-row items-center rounded-field bg-ink-850/40 px-3 py-2.5">
        <Text className="w-8 text-xs font-sans-semibold text-ink-600">{rowLabel}</Text>
        <Text className="flex-1 text-sm text-ink-500">
          {row ? `${row.reps}${row.repsMax ? `–${row.repsMax}` : ''} reps` : ''}
          {row?.groupLabel ? ` · ${row.groupLabel}` : ''}
        </Text>
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

  const confirm = async () => {
    const w = Number(weight);
    const r = Number(reps);
    if (weight === '' || Number.isNaN(w) || w < 0) {
      toast.error(t('training.needWeight'));
      return;
    }
    if (!(r > 0)) {
      toast.error(t('training.needReps'));
      return;
    }
    let eff = effort;
    if (!warmup && row?.wantsEffort && !eff) {
      // The prescription measures effort — ask for it at the moment of truth,
      // with an explicit "save without" escape.
      eff = await requestEffort();
      if (!eff) return;
    }
    onLog(unit === 'lb' ? lbToKg(w) : w, r, {
      rir: eff?.rir ?? null,
      failure: eff?.failure ?? false,
    });
  };

  const pickEffort = async () => {
    const picked = await requestEffort();
    if (picked) setEffort(picked.rir == null && !picked.failure ? null : picked);
  };

  return (
    <View
      className={[
        'rounded-field px-3 py-2',
        warmup
          ? 'border border-dashed border-ink-700 bg-ink-850/40'
          : 'border border-brand/30 bg-ink-850',
      ].join(' ')}
    >
      {row?.groupLabel ? (
        <Text className="mb-1 font-mono-medium text-[10px] uppercase tracking-wider text-brand">
          {row.groupLabel}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Text className="w-8 text-xs font-sans-semibold text-ink-400">{rowLabel}</Text>
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
          onPress={() => void confirm()}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color="#08090d" size={22} />
        </Pressable>
      </View>

      {/* Effort inputs are meaningless on a warm-up — it is submaximal by definition. */}
      {active && !warmup ? (
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
          <Pressable
            onPress={() => void pickEffort()}
            accessibilityRole="button"
            accessibilityLabel={t('training.effortTitle')}
            className={[
              'h-9 flex-row items-center justify-center gap-1 rounded-field border px-2.5',
              effort
                ? effort.failure
                  ? 'border-red-400/50 bg-red-500/15'
                  : 'border-brand/40 bg-brand/10'
                : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            {effort?.failure ? <FlameIcon color="#f87171" size={14} /> : null}
            <Text
              className={[
                'text-xs font-sans-semibold',
                effort ? (effort.failure ? 'text-red-400' : 'text-brand') : 'text-ink-200',
              ].join(' ')}
            >
              {effort ? (effort.failure ? t('training.failure') : `RIR ${effort.rir}`) : 'RIR'}
            </Text>
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
  requestEffort: RequestEffort;
  onLogged: (info: { restSeconds: number; slotId: string; doneCount: number }) => void;
  /** Scroll target when the screen opens from the rest notification. */
  focused: boolean;
  onFocusLayout: (y: number) => void;
};

const ExerciseCard = ({
  workoutLogId,
  planned,
  sets,
  unit,
  lastWeek,
  requestEffort,
  onLogged,
  focused,
  onFocusLayout,
}: CardProps) => {
  const t = useT();
  const router = useRouter();
  const dialog = useDialog();
  const { brand } = useTheme();
  const [extraRows, setExtraRows] = useState(0);
  const [warmupRows, setWarmupRows] = useState(0);

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const warmups = sets.filter((s) => s.isWarmup);
  const doneCount = working.length;
  const planDone = doneCount >= rows.length;
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

  // Ramp toward the first working set, whatever that set is going to weigh.
  const firstWorkingKg = lastWeek[0]?.weightKg ?? suggested;
  const ramp = useMemo(() => warmupRamp(firstWorkingKg), [firstWorkingKg]);
  const warmupPrefill = (i: number): { weightKg: number | null; reps: number } =>
    ramp[i] ?? ramp[ramp.length - 1] ?? { weightKg: null, reps: 5 };

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
    <Card
      className="mb-3"
      onLayout={focused ? (e) => onFocusLayout(e.nativeEvent.layout.y) : undefined}
    >
      <View className="flex-row items-start">
        <Pressable
          onPress={() =>
            router.push({ pathname: '/training/exercise/[id]', params: { id: planned.exerciseId } })
          }
          onLongPress={pickAlternative}
          accessibilityRole="button"
          className="flex-1 pr-2"
        >
          <Text className="text-base font-sans-semibold text-ink-50">{planned.name}</Text>
          {planned.alternativeExerciseIds.length ? (
            <Text className="mt-0.5 text-[11px] text-ink-500">{t('training.holdForAlt')}</Text>
          ) : null}
        </Pressable>
        <ExerciseDocButton exerciseId={planned.exerciseId} size={17} />
      </View>

      {planned.badges.length ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {planned.badges.map((b, i) => (
            <View
              key={`${b}-${i}`}
              className="rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1"
            >
              <Text className="font-mono-medium text-[10px] uppercase tracking-wide text-brand">
                {b}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {lastWeekLine ? <Text className="mt-2 text-xs text-ink-400">{lastWeekLine}</Text> : null}

      {/* Warm-ups sit above the working sets, the order they are performed in.
       * They never advance `doneCount` and never start the prescribed rest. */}
      {warmups.length || warmupRows ? (
        <View className="mt-3 gap-1.5">
          {Array.from({ length: warmups.length + warmupRows }, (_, i) => (
            <SetRow
              key={warmups[i]?.id ?? `warmup-${i}`}
              index={i}
              row={null}
              logged={warmups[i] ?? null}
              active={i === warmups.length}
              unit={unit}
              warmup
              prefill={warmupPrefill(i)}
              requestEffort={requestEffort}
              onLog={(weightKg, reps) => {
                logSet({
                  workoutLogId,
                  exerciseId: planned.exerciseId,
                  weightKg,
                  reps,
                  isWarmup: true,
                });
                setWarmupRows((n) => Math.max(0, n - 1));
              }}
            />
          ))}
        </View>
      ) : null}

      <View className="mt-3 gap-1.5">
        {Array.from({ length: totalRows }, (_, i) => (
          <SetRow
            // Key by logged id when done so React reuses input state correctly.
            key={working[i]?.id ?? `row-${i}`}
            index={i}
            row={rows[i] ?? null}
            logged={working[i] ?? null}
            active={i === doneCount}
            locked={i > doneCount}
            unit={unit}
            prefill={prefillFor(i)}
            requestEffort={requestEffort}
            onLog={(weightKg, reps, opts) => {
              logSet({
                workoutLogId,
                exerciseId: planned.exerciseId,
                weightKg,
                reps,
                rir: opts.rir,
                isFailure: opts.failure,
              });
              onLogged({
                restSeconds: planned.restSeconds ?? 120,
                slotId: planned.slotId,
                doneCount: doneCount + 1,
              });
            }}
          />
        ))}
      </View>

      <View className="mt-2 flex-row items-center justify-center gap-4">
        <Pressable
          onPress={() => setWarmupRows((n) => n + 1)}
          accessibilityRole="button"
          className="flex-row items-center gap-1 py-1.5"
        >
          <PlusIcon color="#71717a" size={14} />
          <Text className="text-xs font-sans-semibold text-ink-400">{t('training.warmupSet')}</Text>
        </Pressable>
        {/* Extra sets only unlock once the plan is done — sets have an order. */}
        {planDone ? (
          <Pressable
            onPress={() => setExtraRows((n) => n + 1)}
            accessibilityRole="button"
            className="flex-row items-center gap-1 py-1.5"
          >
            <PlusIcon color={brand} size={14} />
            <Text className="text-xs font-sans-semibold text-brand">{t('training.extraSet')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
};

const WorkoutSession = () => {
  const { id, slot: focusSlot } = useLocalSearchParams<{ id: string; slot?: string }>();
  const { locale } = useI18n();
  const router = useRouter();
  const t = useT();
  const dialog = useDialog();
  const { user } = useAuth();
  const { brand, muted } = useTheme();
  useKeepAwake();

  // A rest left behind by another session is stale: drop it and its notification.
  useEffect(() => {
    const current = restState.get();
    if (current && current.workoutId !== id) void endRest();
  }, [id]);

  const log = typeof id === 'string' ? getWorkout(id) : null;
  const workoutDayId = log?.workoutDayId ?? null;
  const [unit, setUnit] = useState<Units>(settings.getUnits());
  const [layout, setLayout] = useState<WorkoutLayout>(settings.getWorkoutLayout());
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [orderDraft, setOrderDraft] = useState<PlannedSlot[]>([]);
  const [cardIndex, setCardIndex] = useState(() => {
    const snapshot = typeof id === 'string' ? (getWorkout(id)?.plannedSnapshot ?? []) : [];
    const i = focusSlot ? snapshot.findIndex((p) => p.slotId === focusSlot) : -1;
    return Math.max(0, i);
  });
  // One effort sheet serves every set row; the row awaits the resolver.
  const [effortResolve, setEffortResolve] = useState<((e: Effort | null) => void) | null>(null);
  const activeRest = useActiveRest();
  const rest = activeRest?.workoutId === log?.id ? activeRest : null;
  const clock = useClockFormat();
  const scrollRef = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [finishing, setFinishing] = useState(false);

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

  // Muscles actually hit today, derived from the snapshot's exercises. Cheap
  // enough to recompute (a handful of indexed lookups per render).
  const muscles: MuscleHead[] = [];
  for (const p of planned) {
    const ex = getExercise(p.exerciseId);
    if (!ex) continue;
    for (const h of exerciseHeads(ex)) {
      if (!muscles.includes(h)) muscles.push(h);
    }
  }
  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);

  const totalPlannedSets = planned.reduce(
    (sum, p) => sum + p.setGroups.reduce((x, g) => x + g.sets, 0),
    0,
  );
  const doneSets = sets.filter((s) => !s.isWarmup).length;
  const progress = totalPlannedSets ? Math.min(1, doneSets / totalPlannedSets) : 0;

  const requestEffort: RequestEffort = () =>
    new Promise((resolve) => {
      setEffortResolve(() => (e: Effort | null) => {
        resolve(e);
        setEffortResolve(null);
      });
    });

  const nextSetLine = (next: NextSet): string => {
    if (next.kind === 'done') return t('training.restLast');
    const key = next.kind === 'same' ? 'training.restNext' : 'training.restNextNew';
    return t(key, {
      exercise: next.exerciseName,
      n: next.setNumber,
      total: next.setTotal,
      reps: next.reps,
    });
  };

  // Rest copy is frozen at start (an event, not render) so the lock-screen
  // notification can be redrawn headlessly without i18n.
  const onLogged = ({
    restSeconds,
    slotId,
    doneCount,
  }: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
  }) => {
    const startedAt = Date.now();
    const endsAt = startedAt + restSeconds * 1000;
    const ends = new Date(endsAt);
    const next = nextSetLine(
      nextSetSummary(planned, slotId, doneCount, (exerciseId) => setsFor(exerciseId).length),
    );
    const endsLabel = t('training.restEndsAt', {
      time: formatClockTime(ends.getHours() * 60 + ends.getMinutes(), clock),
    });
    const restPayload = {
      workoutId: log.id,
      slotId,
      startedAt,
      endsAt,
      copy: {
        restingTitle: t('training.restOngoingTitle'),
        restingBody: `${next} · ${endsLabel}`,
        overTitle: t('training.restDoneTitle'),
        overBody: next,
        skipLabel: t('training.skip'),
        plus30Label: t('training.restPlus30'),
        plus60Label: t('training.restPlus1'),
      },
    };
    void ensureNotificationPermission().finally(() => startRest(restPayload));
  };

  const finish = () => setSummary(sessionSummary(log.id, locale));

  // Finish work is synchronous; show the overlay first so the tap gets visible feedback.
  const closeSummary = () => {
    setFinishing(true);
    setTimeout(() => {
      finishWorkout(log.id);
      void endRest();
      void syncTrainingReminder(log.userId);
      setSummary(null);
      router.replace('/training');
    }, OVERLAY_PAINT_MS);
  };

  const cancel = () =>
    dialog.confirm({
      title: t('training.cancelConfirm'),
      confirmLabel: t('training.cancelWorkout'),
      destructive: true,
      onConfirm: () => {
        abandonWorkout(log.id);
        void endRest();
        router.replace('/training');
      },
    });

  const openReorder = () => {
    setOrderDraft(planned);
    setReordering(true);
  };

  const jumpToExercise = () =>
    dialog.show({
      title: t('training.switchExercise'),
      actions: [
        ...planned.map((p, i) => ({ label: p.name, onPress: () => setCardIndex(i) })),
        { label: t('common.cancel'), style: 'cancel' as const },
      ],
    });

  const chooseLayout = (next: WorkoutLayout) => {
    settings.setWorkoutLayout(next);
    setLayout(next);
    setLayoutOpen(false);
  };

  const idx = Math.min(cardIndex, Math.max(0, planned.length - 1));
  const current = planned[idx] ?? null;
  const currentVisual = current
    ? visualIdFor({ id: current.exerciseId, name: current.name })
    : null;

  const renderCard = (p: PlannedSlot, focused: boolean) => (
    <ExerciseCard
      key={p.slotId}
      workoutLogId={log.id}
      planned={p}
      sets={setsFor(p.exerciseId)}
      unit={unit}
      lastWeek={lastWeekBySlot.get(p.slotId) ?? []}
      requestEffort={requestEffort}
      onLogged={onLogged}
      focused={focused}
      onFocusLayout={(y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false })}
    />
  );

  const layoutItems: { value: WorkoutLayout; label: string; icon: React.ReactNode }[] = [
    {
      value: 'cards',
      label: t('training.layoutCards'),
      icon: <ViewGridIcon color={muted} size={18} />,
    },
    { value: 'list', label: t('training.layoutList'), icon: <ListIcon color={muted} size={18} /> },
    {
      value: 'compact',
      label: t('training.layoutCompact'),
      icon: <DragHandleIcon color={muted} size={18} />,
    },
  ];

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          right={
            <View className="flex-row items-center gap-2">
              <Pressable
                hitSlop={8}
                onPress={finish}
                accessibilityRole="button"
                accessibilityLabel={t('training.finish')}
                className="h-9 w-9 items-center justify-center rounded-full bg-brand"
              >
                <CheckIcon color="#08090d" size={18} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={cancel}
                accessibilityRole="button"
                accessibilityLabel={t('training.cancelWorkout')}
                className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
              >
                <XIcon color="#ef4444" size={18} />
              </Pressable>
            </View>
          }
        />
      }
    >
      {/* Session strip: elapsed time, set count, and the fill toward done. */}
      <View className="px-5 pb-1 pt-2">
        <View className="flex-row items-center justify-between">
          <ElapsedClock startedAt={log.startedAt} />
          <Text className="font-mono-medium text-xs tabular-nums text-ink-300">
            {t('training.setsOf', { done: doneSets, total: totalPlannedSets })}
          </Text>
        </View>
        <View className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-800">
          <View className="h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} />
        </View>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-5 pb-2"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title={day ? dayDisplayName(day, t) : t('training.workout')}
          subtitle={t('training.weekN', { n: log.weekNumber })}
        />

        {muscles.length ? (
          <View className="mb-3 flex-row flex-wrap gap-1.5">
            {muscles.slice(0, 5).map((h) => (
              <View key={h} className="rounded-full bg-ink-800 px-2.5 py-1">
                <Text className="text-[11px] font-sans-medium text-ink-300">
                  {t(muscleHeadKey(h))}
                </Text>
              </View>
            ))}
            {muscles.length > 5 ? (
              <View className="rounded-full bg-ink-800 px-2.5 py-1">
                <Text className="text-[11px] font-sans-medium text-ink-400">
                  +{muscles.length - 5}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="mb-4 flex-row items-center justify-between">
          {/* Units ride the scroll: a set-and-forget control, not worth pinning. */}
          <View className="w-32">
            <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={setUnit} />
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={openReorder}
              accessibilityRole="button"
              accessibilityLabel={t('training.reorder')}
              className="h-10 w-10 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <DragHandleIcon color={muted} size={18} />
            </Pressable>
            <Pressable
              onPress={() => setLayoutOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('training.layout')}
              className="h-10 w-10 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <ViewGridIcon color={muted} size={18} />
            </Pressable>
          </View>
        </View>

        {planned.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('training.empty')}</Text>
        ) : layout === 'cards' && current ? (
          <>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                {t('training.exerciseOf', { n: idx + 1, total: planned.length })}
              </Text>
              <Pressable
                onPress={jumpToExercise}
                accessibilityRole="button"
                className="flex-row items-center gap-1.5 py-1"
              >
                <ListIcon color={brand} size={15} />
                <Text className="text-xs font-sans-semibold text-brand">
                  {t('training.switchExercise')}
                </Text>
              </Pressable>
            </View>
            {currentVisual ? (
              <View className="mb-3">
                <ExerciseFrames
                  visualId={currentVisual}
                  size={150}
                  accessibilityLabel={current.name}
                />
              </View>
            ) : null}
            {renderCard(current, false)}
            <View className="mt-1 flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="secondary"
                  label={t('training.prev')}
                  leftIcon={<ChevronLeftIcon color={muted} size={16} />}
                  disabled={idx === 0}
                  onPress={() => setCardIndex(idx - 1)}
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="secondary"
                  label={t('training.next')}
                  leftIcon={<ChevronRightIcon color={muted} size={16} />}
                  disabled={idx >= planned.length - 1}
                  onPress={() => setCardIndex(idx + 1)}
                />
              </View>
            </View>
          </>
        ) : (
          planned.map((p) => renderCard(p, p.slotId === focusSlot))
        )}
      </KeyboardAwareScrollView>

      {rest ? (
        <View className="gap-3 px-5 pb-2 pt-3">
          <RestTimer
            key={rest.startedAt}
            endsAt={rest.endsAt}
            onExtend={(seconds) => void extendRest(seconds)}
            onDone={() => void endRest()}
          />
        </View>
      ) : null}

      {/* Effort sheet — the one place RIR / failure gets reported. */}
      <Sheet visible={!!effortResolve} onClose={() => effortResolve?.(null)}>
        <View className="px-5 pb-6">
          <Text className="mb-3 text-lg font-sans-bold text-ink-50">
            {t('training.effortTitle')}
          </Text>
          <View className="gap-2">
            <Pressable
              onPress={() => effortResolve?.({ rir: 0, failure: true })}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-field border border-red-400/40 bg-red-500/10 px-4 py-3.5"
            >
              <FlameIcon color="#f87171" size={18} />
              <Text className="flex-1 text-sm font-sans-semibold text-red-400">
                {t('training.effortFailure')}
              </Text>
            </Pressable>
            {[1, 2, 3].map((n) => (
              <Pressable
                key={n}
                onPress={() => effortResolve?.({ rir: n, failure: false })}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-field border border-ink-700 bg-ink-800 px-4 py-3.5"
              >
                <View className="h-7 w-7 items-center justify-center rounded-full bg-brand/15">
                  <Text className="text-sm font-sans-bold text-brand">{n}</Text>
                </View>
                <Text className="flex-1 text-sm font-sans-medium text-ink-100">
                  {t('training.effortRir', { n })}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => effortResolve?.({ rir: 4, failure: false })}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-field border border-ink-700 bg-ink-800 px-4 py-3.5"
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-ink-700">
                <Text className="text-sm font-sans-bold text-ink-200">4+</Text>
              </View>
              <Text className="flex-1 text-sm font-sans-medium text-ink-100">
                {t('training.effortRir4')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => effortResolve?.({ rir: null, failure: false })}
              accessibilityRole="button"
              className="items-center rounded-field px-4 py-3"
            >
              <Text className="text-sm font-sans-medium text-ink-400">
                {t('training.effortSkip')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Sheet>

      {/* Layout sheet — compact is announced but not built yet. */}
      <Sheet visible={layoutOpen} onClose={() => setLayoutOpen(false)}>
        <View className="px-5 pb-6">
          <Text className="mb-3 text-lg font-sans-bold text-ink-50">{t('training.layout')}</Text>
          <View className="gap-2">
            {layoutItems.map((item) => {
              const disabled = item.value === 'compact';
              const active = item.value === layout;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => chooseLayout(item.value)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled }}
                  className={[
                    'flex-row items-center gap-3 rounded-field border px-4 py-3.5',
                    active ? 'border-brand/40 bg-brand/10' : 'border-ink-700 bg-ink-800',
                    disabled ? 'opacity-50' : '',
                  ].join(' ')}
                >
                  {item.icon}
                  <Text className="flex-1 text-sm font-sans-medium text-ink-100">{item.label}</Text>
                  {disabled ? (
                    <Text className="text-[11px] font-sans-semibold uppercase text-ink-500">
                      {t('common.soon')}
                    </Text>
                  ) : active ? (
                    <CheckIcon color={brand} size={16} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Sheet>

      {/* Mid-session reorder: full-row drag, persisted into the snapshot. */}
      <Modal visible={reordering} animationType="fade" onRequestClose={() => setReordering(false)}>
        <Screen
          edges={['top', 'bottom']}
          contentClassName="px-5"
          footer={
            <Button variant="brand" label={t('common.done')} onPress={() => setReordering(false)} />
          }
        >
          <ScreenTitle title={t('training.reorder')} />
          <ReorderableList
            data={orderDraft}
            keyExtractor={(p) => p.slotId}
            renderItem={({ item }) => (
              <ReorderRow
                title={item.name}
                subtitle={`${setsFor(item.exerciseId).filter((s) => !s.isWarmup).length}/${item.setGroups.reduce((x, g) => x + g.sets, 0)}`}
                dragLabel={t('editor.dragHandle')}
                onPress={() => {}}
              />
            )}
            onReorder={({ from, to }) => {
              const next = reorderItems(orderDraft, from, to);
              setOrderDraft(next);
              reorderSnapshot(
                log.id,
                next.map((p) => p.slotId),
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </Screen>
      </Modal>

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
      <BlockingOverlay visible={finishing} label={t('training.finishing')} />
    </Screen>
  );
};

export default WorkoutSession;
