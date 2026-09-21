import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DragHandleIcon,
  EyeClosedIcon,
  EyeIcon,
  FlameIcon,
  ListIcon,
  PlusIcon,
  ViewGridIcon,
  XIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  BadgeRow,
  BlockingOverlay,
  Card,
  Input,
  ReorderRow,
  Screen,
  ScreenTitle,
  ScrollArea,
  SegmentedControl,
  Select,
  Sheet,
  TextLink,
  TimedModal,
  useDialog,
  useToast,
  type Segment,
} from '@/components/ui';
import type { PlannedSlot, SetGroup, SetLog } from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { lbToKg } from '@/features/bmr/calc';
import { fromKg } from '@/features/training/progression';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { RestTimer } from '@/features/training/components/RestTimer';
import { StepGroup } from '@/features/training/components/StepGroup';
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
import { playSound } from '@/lib/sounds';
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
/** The row the action bar drives: a pending warm-up first, else the next working set. */
type RowKey = string;

type RowDraft = { weight: string; reps: string; effort: Effort | null };

type PlanRowProps = {
  label: string;
  legend: string | null;
  plan: string | null;
};

/** A set that has not come up yet: the plan, dimmed, no inputs. Sets are done in order. */
const PendingRow = ({ label, legend, plan }: PlanRowProps) => (
  <View className="flex-row items-center rounded-field bg-ink-850/40 px-3 py-2.5">
    <Text className="w-7 text-xs font-sans-semibold text-ink-600">{label}</Text>
    <Text className="flex-1 text-xs text-ink-500">
      {[legend, plan].filter(Boolean).join(' · ')}
    </Text>
  </View>
);

const LoggedRow = ({
  label,
  logged,
  unit,
  warmup,
  failureLabel,
}: {
  label: string;
  logged: SetLog;
  unit: Units;
  warmup: boolean;
  failureLabel: string;
}) => {
  const { brandContrast } = useTheme();
  return (
    <View className="flex-row items-center rounded-field bg-ink-850 px-3 py-2">
      <View
        className={[
          'mr-2.5 h-5 w-5 items-center justify-center rounded-full',
          warmup ? 'bg-ink-600' : 'bg-brand',
        ].join(' ')}
      >
        <CheckIcon color={brandContrast} size={13} />
      </View>
      <Text className="w-7 text-xs font-sans-semibold text-ink-400">{label}</Text>
      <Text className="flex-1 text-sm font-sans-medium text-ink-100">
        {fromKg(logged.weightKg, unit)} {unit} × {logged.reps}
        {logged.rir != null ? ` · RIR ${logged.rir}` : ''}
        {logged.isFailure ? ` · ${failureLabel}` : ''}
      </Text>
      <Pressable hitSlop={8} onPress={() => deleteSet(logged.id)} accessibilityRole="button">
        <XIcon color="#71717a" size={15} />
      </Pressable>
    </View>
  );
};

/**
 * The set being filled: number and prescription share the legend line so the
 * inputs get the full width, and the brand ring marks it as live. The ± / RIR
 * controls live once at the bottom of the card and drive this row.
 */
const ActiveRow = ({
  label,
  legend,
  draft,
  unit,
  placeholder,
  onChange,
  onConfirm,
  onRemove,
}: {
  label: string;
  legend: string | null;
  draft: RowDraft;
  unit: Units;
  placeholder: string;
  onChange: (patch: Partial<RowDraft>) => void;
  onConfirm: () => void;
  onRemove?: () => void;
}) => {
  const t = useT();
  const { brandContrast } = useTheme();

  return (
    <View className="rounded-field border border-brand/40 bg-ink-850 px-3 py-2">
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-xs font-sans-bold text-brand">{label}</Text>
        {legend ? (
          <Text className="ml-2 flex-1 font-mono-medium text-[10px] uppercase tracking-wider text-brand">
            {legend}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button">
            <XIcon color="#71717a" size={14} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Input
            value={draft.weight}
            onChangeText={(weight) => onChange({ weight })}
            keyboardType="decimal-pad"
            placeholder={unit}
            maxLength={6}
          />
        </View>
        <View className="w-[84px]">
          <Input
            value={draft.reps}
            onChangeText={(reps) => onChange({ reps })}
            keyboardType="number-pad"
            placeholder={placeholder}
            maxLength={3}
          />
        </View>
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color={brandContrast} size={22} />
        </Pressable>
      </View>
    </View>
  );
};

type CardProps = {
  workoutLogId: string;
  planned: PlannedSlot;
  sets: SetLog[];
  unit: Units;
  lastWeek: SetLog[];
  showArt: boolean;
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
  showArt,
  requestEffort,
  onLogged,
  focused,
  onFocusLayout,
}: CardProps) => {
  const t = useT();
  const router = useRouter();
  const dialog = useDialog();
  const toast = useToast();
  const { brand } = useTheme();
  const [weightStep, setWeightStep] = useState(() => settings.getWeightStep());
  const [repsStep, setRepsStep] = useState(() => settings.getRepsStep());
  const [extraRows, setExtraRows] = useState(0);
  const [warmupRows, setWarmupRows] = useState(0);
  // Keyed by row so advancing a set never carries the previous row's numbers.
  const [drafts, setDrafts] = useState<Record<RowKey, RowDraft>>({});

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const warmups = sets.filter((s) => s.isWarmup);
  const doneCount = working.length;
  const planDone = doneCount >= rows.length;
  const totalRows = Math.max(rows.length, doneCount) + extraRows;
  const visualId = visualIdFor({ id: planned.exerciseId, name: planned.name });

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

  const pendingWarmups = warmupRows > 0;
  // Warm-ups are performed before the working sets, so they hold the focus.
  const activeKey: RowKey | null = pendingWarmups
    ? `w${warmups.length}`
    : doneCount < totalRows
      ? `${doneCount}`
      : null;
  const activeIsWarmup = pendingWarmups;

  const seedDraft = (key: RowKey): RowDraft => {
    const fill = key.startsWith('w')
      ? warmupPrefill(Number(key.slice(1)))
      : prefillFor(Number(key));
    return {
      weight: fill.weightKg != null ? String(fromKg(fill.weightKg, unit)) : '',
      reps: String(fill.reps),
      effort: null,
    };
  };
  const draftFor = (key: RowKey): RowDraft => drafts[key] ?? seedDraft(key);
  const patchDraft = (key: RowKey, patch: Partial<RowDraft>) =>
    setDrafts((prev) => ({ ...prev, [key]: { ...draftFor(key), ...patch } }));

  const bump = (field: 'weight' | 'reps', delta: number) => {
    if (!activeKey) return;
    const current = Number(draftFor(activeKey)[field]) || 0;
    const next =
      field === 'weight'
        ? Math.max(0, Math.round((current + delta) * 10) / 10)
        : Math.max(1, current + delta);
    patchDraft(activeKey, { [field]: String(next) } as Partial<RowDraft>);
  };

  const confirm = async (key: RowKey) => {
    const draft = draftFor(key);
    const isWarmup = key.startsWith('w');
    const index = Number(isWarmup ? key.slice(1) : key);
    const w = Number(draft.weight);
    const r = Number(draft.reps);
    if (draft.weight === '' || Number.isNaN(w) || w < 0) {
      toast.error(t('training.needWeight'));
      return;
    }
    if (!(r > 0)) {
      toast.error(t('training.needReps'));
      return;
    }
    // A prescription that measures effort is not logged without it: the RIR
    // chip in the action bar picks it, the check only reminds.
    const effort = draft.effort;
    if (!isWarmup && rows[index]?.wantsEffort && !effort) {
      toast.error(t('training.needRir'));
      return;
    }
    const weightKg = unit === 'lb' ? lbToKg(w) : w;
    logSet({
      workoutLogId,
      exerciseId: planned.exerciseId,
      weightKg,
      reps: r,
      ...(isWarmup
        ? { isWarmup: true }
        : { rir: effort?.rir ?? null, isFailure: effort?.failure ?? false }),
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (isWarmup) {
      setWarmupRows((n) => Math.max(0, n - 1));
      return;
    }
    onLogged({
      restSeconds: planned.restSeconds ?? 120,
      slotId: planned.slotId,
      doneCount: doneCount + 1,
    });
  };

  const pickEffort = async () => {
    if (!activeKey) return;
    const picked = await requestEffort();
    if (picked)
      patchDraft(activeKey, { effort: picked.rir == null && !picked.failure ? null : picked });
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

  const activeDraft = activeKey ? draftFor(activeKey) : null;
  const activeRow = activeKey && !activeIsWarmup ? (rows[Number(activeKey)] ?? null) : null;

  return (
    <Card
      className="mb-3"
      onLayout={focused ? (e) => onFocusLayout(e.nativeEvent.layout.y) : undefined}
    >
      {/* The movement first: what to do reads faster than its name. */}
      {showArt && visualId ? (
        <View className="mb-3">
          <ExerciseFrames visualId={visualId} accessibilityLabel={planned.name} autoplay={false} />
        </View>
      ) : null}

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
        <View className="mt-2">
          <BadgeRow
            mono
            tone="brand"
            items={planned.badges.map((b, i) => ({ value: `${b}-${i}`, label: b }))}
          />
        </View>
      ) : null}

      {lastWeekLine ? <Text className="mt-2 text-xs text-ink-400">{lastWeekLine}</Text> : null}

      {/* Warm-ups sit above the working sets, the order they are performed in.
       * They never advance `doneCount` and never start the prescribed rest. */}
      {warmups.length || warmupRows ? (
        <View className="mt-3 gap-1.5">
          {warmups.map((set, i) => (
            <LoggedRow
              key={set.id}
              label={t('training.warmupShort')}
              logged={set}
              unit={unit}
              warmup
              failureLabel={t('training.failure')}
            />
          ))}
          {warmupRows > 0 && activeKey && activeIsWarmup && activeDraft ? (
            <ActiveRow
              label={t('training.warmupShort')}
              legend={t('training.warmupLegend')}
              draft={activeDraft}
              unit={unit}
              placeholder={String(warmupPrefill(warmups.length).reps)}
              onChange={(patch) => patchDraft(activeKey, patch)}
              onConfirm={() => void confirm(activeKey)}
              onRemove={() => setWarmupRows((n) => Math.max(0, n - 1))}
            />
          ) : null}
        </View>
      ) : null}

      <View className="mt-3 gap-1.5">
        {Array.from({ length: totalRows }, (_, i) => {
          const key = `${i}`;
          const logged = working[i] ?? null;
          const row = rows[i] ?? null;
          if (logged) {
            return (
              <LoggedRow
                key={logged.id}
                label={String(i + 1)}
                logged={logged}
                unit={unit}
                warmup={false}
                failureLabel={t('training.failure')}
              />
            );
          }
          const plan = row ? `${row.reps}${row.repsMax ? `–${row.repsMax}` : ''} reps` : null;
          if (key !== activeKey || activeIsWarmup) {
            return (
              <PendingRow
                key={key}
                label={String(i + 1)}
                legend={row?.groupLabel ?? null}
                plan={plan}
              />
            );
          }
          return (
            <ActiveRow
              key={key}
              label={String(i + 1)}
              legend={row?.groupLabel ?? null}
              draft={draftFor(key)}
              unit={unit}
              placeholder={row ? `${row.reps}${row.repsMax ? `-${row.repsMax}` : ''}` : '0'}
              onChange={(patch) => patchDraft(key, patch)}
              onConfirm={() => void confirm(key)}
            />
          );
        })}
      </View>

      {/* One control bar per card, always in the same place, driving the live row. */}
      {activeKey && activeDraft ? (
        <View className="mt-2.5 flex-row items-end gap-2 border-t border-ink-800 pt-2.5">
          <StepGroup
            label={`${t('training.weight')} · ${unit}`}
            step={weightStep}
            onStepChange={(n) => {
              settings.setWeightStep(n);
              setWeightStep(n);
            }}
            onBump={(d) => bump('weight', d)}
          />
          <View className="w-px self-stretch bg-ink-800" />
          <StepGroup
            label={t('training.reps')}
            step={repsStep}
            onStepChange={(n) => {
              settings.setRepsStep(n);
              setRepsStep(n);
            }}
            onBump={(d) => bump('reps', d)}
          />
          {activeIsWarmup ? null : (
            <>
              <View className="w-px self-stretch bg-ink-800" />
              <Pressable
                onPress={() => void pickEffort()}
                accessibilityRole="button"
                accessibilityLabel={t('training.effortTitle')}
                className={[
                  'h-9 flex-row items-center justify-center gap-1 rounded-field border px-3',
                  activeDraft.effort
                    ? activeDraft.effort.failure
                      ? 'border-red-400/50 bg-red-500/15'
                      : 'border-brand/40 bg-brand/10'
                    : activeRow?.wantsEffort
                      ? 'border-brand/25 bg-ink-800'
                      : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                {activeDraft.effort?.failure ? <FlameIcon color="#f87171" size={14} /> : null}
                <Text
                  className={[
                    'text-xs font-sans-semibold',
                    activeDraft.effort
                      ? activeDraft.effort.failure
                        ? 'text-red-400'
                        : 'text-brand'
                      : 'text-ink-200',
                  ].join(' ')}
                >
                  {activeDraft.effort
                    ? activeDraft.effort.failure
                      ? t('training.failure')
                      : `RIR ${activeDraft.effort.rir}`
                    : 'RIR'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

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
  const { brand, brandContrast, muted } = useTheme();
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
  const [showArt, setShowArt] = useState(() => settings.getShowExerciseArt());
  const [warmupOpen, setWarmupOpen] = useState(true);
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

  // An exercise is done when its planned working sets are all logged.
  const doneSlot = (p: PlannedSlot): boolean =>
    sets.filter((x) => !x.isWarmup && x.exerciseId === p.exerciseId).length >=
    p.setGroups.reduce((x, g) => x + g.sets, 0);
  const firstPendingId = (log?.plannedSnapshot ?? []).find((p) => !doneSlot(p))?.slotId ?? null;
  // Finishing an exercise brings the next one to the top of the screen, so
  // the session reads top-down instead of scrolling past what is done.
  useEffect(() => {
    if (layout === 'list') scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [firstPendingId, layout]);

  if (!user || !log || log.status !== 'in_progress') return <Redirect href="/training" />;

  const planned = log.plannedSnapshot ?? [];
  const listOrder = [...planned.filter((p) => !doneSlot(p)), ...planned.filter(doneSlot)];

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

  // Confirmed before anything happens: the two header buttons sit side by side,
  // and ending a session by a mis-tap cannot be undone.
  const finish = () =>
    dialog.confirm({
      title: t('training.finishConfirm'),
      message: t('training.finishConfirmBody'),
      confirmLabel: t('training.finish'),
      onConfirm: () => {
        playSound('sessionDone');
        setSummary(sessionSummary(log.id, locale));
      },
    });

  // Finish work is synchronous; show the overlay first so the tap gets visible feedback.
  const closeSummary = () => {
    if (finishing) return;
    setFinishing(true);
    setTimeout(() => {
      finishWorkout(log.id);
      void endRest();
      void syncTrainingReminder(log.userId);
      setSummary(null);
      // `settling` keeps the wait on screen while the tab mounts and runs its
      // queries; without it the hand-off flashes a half-built Train tab.
      router.replace({ pathname: '/training', params: { settling: '1' } });
    }, OVERLAY_PAINT_MS);
  };

  const cancel = () =>
    dialog.confirm({
      title: t('training.cancelConfirm'),
      confirmLabel: t('training.cancelWorkout'),
      destructive: true,
      onConfirm: () => {
        playSound('discard');
        abandonWorkout(log.id);
        void endRest();
        router.replace('/training');
      },
    });

  const openReorder = () => {
    setOrderDraft(planned);
    setReordering(true);
  };

  // Remembered across sessions: whoever turns the art off means it.
  const toggleArt = () => {
    const next = !showArt;
    settings.setShowExerciseArt(next);
    setShowArt(next);
  };

  // Two modes only, so the control is a toggle rather than a picker: one tap
  // swaps them, the same way the eye swaps the illustrations.
  const toggleLayout = () => {
    const next: WorkoutLayout = layout === 'list' ? 'cards' : 'list';
    settings.setWorkoutLayout(next);
    setLayout(next);
  };

  const idx = Math.min(cardIndex, Math.max(0, planned.length - 1));
  const current = planned[idx] ?? null;

  const renderCard = (p: PlannedSlot, focused: boolean) => (
    <ExerciseCard
      key={p.slotId}
      workoutLogId={log.id}
      planned={p}
      sets={setsFor(p.exerciseId)}
      unit={unit}
      lastWeek={lastWeekBySlot.get(p.slotId) ?? []}
      showArt={showArt}
      requestEffort={requestEffort}
      onLogged={onLogged}
      focused={focused}
      onFocusLayout={(y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false })}
    />
  );

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
                <CheckIcon color={brandContrast} size={18} />
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
      {/* Pinned session strip: what split, how long, how much is left. It stays
       * put while the sets scroll, so the header costs one compact block. */}
      <View className="px-5 pb-2 pt-1">
        <Text className="text-base font-sans-bold text-ink-50" numberOfLines={1}>
          {day ? dayDisplayName(day, t) : t('training.workout')}
        </Text>
        <View className="mt-0.5 flex-row items-center justify-between">
          <Text className="text-xs text-ink-400">{t('training.weekN', { n: log.weekNumber })}</Text>
          <View className="flex-row items-center gap-2">
            <ElapsedClock startedAt={log.startedAt} />
            <Text className="text-xs text-ink-600">·</Text>
            <Text className="font-mono-medium text-xs tabular-nums text-ink-300">
              {t('training.setsOf', { done: doneSets, total: totalPlannedSets })}
            </Text>
          </View>
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
        {muscles.length ? (
          <View className="mb-3">
            <BadgeRow items={muscles.map((h) => ({ value: h, label: t(muscleHeadKey(h)) }))} />
          </View>
        ) : null}

        <View className="mb-4 flex-row items-center justify-between">
          {/* Units ride the scroll: a set-and-forget control, not worth pinning. */}
          <View className="w-32">
            <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={setUnit} />
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={toggleArt}
              accessibilityRole="button"
              accessibilityLabel={showArt ? t('training.artHide') : t('training.artShow')}
              accessibilityState={{ selected: showArt }}
              className={[
                'h-10 w-10 items-center justify-center rounded-field border',
                showArt ? 'border-brand/40 bg-brand/10' : 'border-ink-700 bg-ink-800',
              ].join(' ')}
            >
              {showArt ? (
                <EyeIcon color={brand} size={18} />
              ) : (
                <EyeClosedIcon color={muted} size={18} />
              )}
            </Pressable>
            <Pressable
              onPress={openReorder}
              accessibilityRole="button"
              accessibilityLabel={t('training.reorder')}
              className="h-10 w-10 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
            >
              <DragHandleIcon color={muted} size={18} />
            </Pressable>
            <Pressable
              onPress={toggleLayout}
              accessibilityRole="button"
              accessibilityLabel={
                layout === 'list' ? t('training.layoutCompact') : t('training.layoutList')
              }
              accessibilityState={{ selected: layout === 'cards' }}
              className={[
                'h-10 w-10 items-center justify-center rounded-field border',
                layout === 'cards' ? 'border-brand/40 bg-brand/10' : 'border-ink-700 bg-ink-800',
              ].join(' ')}
            >
              {layout === 'cards' ? (
                <ViewGridIcon color={brand} size={18} />
              ) : (
                <ListIcon color={muted} size={18} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Optional, and deliberately first: the warm-up is the part that gets
         * skipped, and it belongs before the first working set. */}
        {warmupOpen ? (
          <Card className="mb-3 border-brand/25 bg-brand/5">
            <View className="flex-row items-start">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-sans-semibold text-ink-50">
                  {t('warmup.sessionTitle')}
                </Text>
                <Text className="mt-0.5 font-mono-medium text-[10px] uppercase tracking-wider text-brand">
                  {t('warmup.optional')}
                </Text>
              </View>
              <Pressable
                onPress={() => setWarmupOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <XIcon color={muted} size={15} />
              </Pressable>
            </View>
            <View className="mt-2">
              <TextLink
                label={t('warmup.sessionOpen')}
                onPress={() => router.push('/training/warmups')}
              />
            </View>
          </Card>
        ) : null}

        {planned.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('training.empty')}</Text>
        ) : layout === 'cards' && current ? (
          <>
            <View className="mb-2">
              <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
                {t('training.exerciseOf', { n: idx + 1, total: planned.length })}
              </Text>
              <Select
                items={planned.map((p, i) => ({ value: String(i), label: p.name }))}
                value={String(idx)}
                onChange={(v) => setCardIndex(Number(v))}
                placeholder={t('training.switchExercise')}
              />
            </View>
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
          listOrder.map((p) => renderCard(p, p.slotId === focusSlot))
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
        <ScrollArea inSheet>
          <View className="pb-6">
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
              {[1, 2, 3, 4].map((n) => (
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
                    {t('training.effortRir')}
                  </Text>
                </Pressable>
              ))}
              {/* The open end of the scale: anything easier than four. */}
              <Pressable
                onPress={() => effortResolve?.({ rir: 5, failure: false })}
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-field border border-ink-700 bg-ink-800 px-4 py-3.5"
              >
                <View className="h-7 w-7 items-center justify-center rounded-full bg-ink-700">
                  <Text className="text-sm font-sans-bold text-ink-200">5+</Text>
                </View>
                <Text className="flex-1 text-sm font-sans-medium text-ink-100">
                  {t('training.effortRir5')}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollArea>
      </Sheet>

      {/* Mid-session reorder: full-row drag, persisted into the snapshot. */}
      <Modal visible={reordering} animationType="fade" onRequestClose={() => setReordering(false)}>
        {/* A Modal is its own native view tree: without a gesture root inside
         * it, the drag handles never receive touches. */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Screen
            edges={['top', 'bottom']}
            contentClassName="px-5"
            footer={
              <Button
                variant="brand"
                label={t('common.done')}
                onPress={() => setReordering(false)}
              />
            }
          >
            <ScreenTitle title={t('training.reorder')} subtitle={t('training.reorderHint')} />
            <ReorderableList
              data={orderDraft}
              keyExtractor={(p) => p.slotId}
              renderItem={({ item }) => (
                <ReorderRow
                  dragOnly
                  title={item.name}
                  subtitle={t('training.setsOf', {
                    done: setsFor(item.exerciseId).filter((x) => !x.isWarmup).length,
                    total: item.setGroups.reduce((x, g) => x + g.sets, 0),
                  })}
                  dragLabel={t('training.reorderHint')}
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
        </GestureHandlerRootView>
      </Modal>

      {/* Post-workout summary: closes itself, because the session is already
       * over and there is nothing left to decide. */}
      <TimedModal visible={summary !== null} onDone={closeSummary}>
        <View className="items-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
            <CheckIcon color={brandContrast} size={28} />
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
              <Text className="text-sm font-sans-semibold text-ink-100">{summary.setCount}</Text>
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
        <Text className="mt-5 text-center text-[11px] leading-4 text-ink-500">
          {t('training.summaryAuto')}
        </Text>
      </TimedModal>
      <BlockingOverlay visible={finishing} label={t('training.finishing')} />
    </Screen>
  );
};

export default WorkoutSession;
