import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AppState, Modal, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DragHandleIcon,
  DumbbellIcon,
  EyeClosedIcon,
  EyeIcon,
  FlameIcon,
  ListIcon,
  PlusIcon,
  SwapIcon,
  ViewGridIcon,
  XIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  BadgeRow,
  BlockingOverlay,
  Card,
  ChipRow,
  ReorderRow,
  Screen,
  ScreenTitle,
  ScrollArea,
  SegmentedControl,
  Sheet,
  TextLink,
  TimedModal,
  useDialog,
  useToast,
} from '@/components/ui';
import type {
  Equipment,
  ExerciseSetting,
  PlannedSlot,
  SetGroup,
  SetLog,
  WorkoutLog,
} from '@/db/schema';
import { useAuth } from '@/features/auth/auth-context';
import { pushProfile } from '@/features/auth/profile-sync';
import { lbToKg } from '@/features/bmr/calc';
import { fromKg } from '@/features/training/progression';
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { SetInput } from '@/features/training/components/SetInput';
import { SessionNotes } from '@/features/training/components/SessionNotes';
import { RestTimer } from '@/features/training/components/RestTimer';
import { StepGroup } from '@/features/training/components/StepGroup';
import { WeightCalculatorSheet } from '@/features/training/components/WeightCalculatorSheet';
import {
  endRest,
  extendRest,
  redrawSession,
  showSession,
  startRest,
} from '@/features/notifications/rest-notification';
import { ensureNotificationPermission } from '@/features/notifications/service';
import { restState, useActiveRest } from '@/features/training/rest-state';
import { nextSetSummary, type NextSet } from '@/features/training/rest-summary';
import {
  sessionState,
  type ActiveSession,
  type NextSetCopy,
} from '@/features/training/session-state';
import {
  dayDisplayName,
  groupIntensity,
  targetLine,
  type SetTarget,
} from '@/features/training/labels';
import { exerciseFactsQuery, getExercise } from '@/features/training/exercises.repo';
import {
  exerciseSettingsQuery,
  upsertExerciseSetting,
} from '@/features/training/exercise-settings.repo';
import { defaultHands, describeLoad, hasLoadDetail, reconcileLoad } from '@/features/training/load';
import { visualIdFor } from '@/features/training/exercise-visuals';
import { getWorkoutDay } from '@/features/training/programs.repo';
import { closeSession } from '@/features/training/close-session';
import { bumpValue, nextSetPrefill, weightText } from '@/features/training/set-prefill';
import { sessionBadges } from '@/features/training/session-badges';
import {
  clearDraft,
  clearDraftLoads,
  useSessionDrafts,
  useSlotCounts,
  writeDraft,
  writeSlotCounts,
  type Effort,
  type RowDraft,
} from '@/features/training/workout-drafts';
import {
  deleteSet,
  getWorkout,
  workoutQuery,
  lastLoggedSet,
  lastWeekSets,
  logSet,
  reorderSnapshot,
  sessionSummary,
  setLogsQuery,
  suggestedWeight,
  swapSnapshotExercise,
  type SessionSummary,
} from '@/features/training/session.repo';
import { prefillSourceKey, swapOptions } from '@/features/training/variants';
import { warmupRamp } from '@/features/training/warmup';
import { useI18n, useT, type TFunction } from '@/i18n';
import { settings, type Units, type WorkoutLayout } from '@/lib/storage';
import { playSound } from '@/lib/sounds';
import { UNIT_SEGMENTS, useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

// Lets the blocking overlay paint before the synchronous finish work.
const OVERLAY_PAINT_MS = 50;

/** What the lifter reports after a set; `rir: null` = deliberately skipped. */
type RequestEffort = () => Promise<Effort | null>;

/** One planned set row, expanded from the snapshot's set groups. */
type PlannedRow = SetTarget & {
  /** The prescription asks for an effort reading (RIR range or to-failure). */
  wantsEffort: boolean;
};

const expandRows = (groups: SetGroup[], t: TFunction): PlannedRow[] => {
  const multi = groups.length > 1;
  return groups.flatMap((g, gi) => {
    const intensity = groupIntensity(g, t);
    const groupName = multi ? (gi === 0 ? t('training.topSet') : t('training.backOff')) : null;
    return Array.from({ length: g.sets }, () => ({
      groupName,
      intensity,
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

const OTHER_UNIT = (unit: Units): Units => (unit === 'kg' ? 'lb' : 'kg');

/**
 * A kg value the lifter can tap to see in the other unit (backlog B2): shows
 * the value converted, one tap restores the app unit. Local to each row, so
 * the rest of the screen stays in the app unit.
 */
const ConvertibleWeight = ({ kg, unit }: { kg: number; unit: Units }) => {
  const t = useT();
  const [override, setOverride] = useState<Units | null>(null);
  const shown = override ?? unit;
  const text = `${weightText(kg, shown)} ${shown}`;
  return (
    <Pressable
      onPress={() => setOverride((prev) => (prev ? null : OTHER_UNIT(unit)))}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityHint={t('training.tapToConvert')}
    >
      <Text className="text-sm font-sans-medium text-ink-100">{text}</Text>
    </Pressable>
  );
};

/** A set that has not come up yet: the plan, dimmed, no inputs. Sets are done in order. */
const PendingRow = ({ label, legend }: { label: string; legend: string | null }) => (
  <View className="flex-row items-center rounded-field bg-ink-850/40 px-3 py-2.5">
    <Text className="w-7 text-xs font-sans-semibold text-ink-600">{label}</Text>
    <Text className="flex-1 text-xs text-ink-500">{legend}</Text>
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
  const { brandContrast, muted } = useTheme();
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
      <View className="flex-1 flex-row items-center">
        {/* Two dumbbells read as "2 × 30 kg × 10": the count goes first so it
            cannot be mistaken for the reps. */}
        {logged.load?.kind === 'dumbbell' && logged.load.hands === 2 ? (
          <Text className="text-sm font-sans-medium text-ink-400">2 × </Text>
        ) : null}
        <ConvertibleWeight kg={logged.weightKg} unit={unit} />
        <Text className="text-sm font-sans-medium text-ink-100">
          {' '}
          × {logged.reps}
          {logged.rir != null ? ` · RIR ${logged.rir}` : ''}
          {logged.isFailure ? ` · ${failureLabel}` : ''}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={() => deleteSet(logged.id)} accessibilityRole="button">
        <XIcon color={muted} size={15} />
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
  onOpenCalculator,
  detailActive = false,
  caption,
}: {
  label: string;
  legend: string | null;
  draft: RowDraft;
  unit: Units;
  placeholder: string;
  onChange: (patch: Partial<RowDraft>) => void;
  onConfirm: () => void;
  onRemove?: () => void;
  onOpenCalculator?: () => void;
  /** A load detail is saved for this exercise: the sheet icon says so in `info`. */
  detailActive?: boolean;
  /** Per-hand / total, or how the load is built — the row stays a plain number. */
  caption?: string | null;
}) => {
  const t = useT();
  const { brandContrast, muted, info } = useTheme();

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
            <XIcon color={muted} size={14} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="flex-1">
          <SetInput
            value={draft.weight}
            onChangeText={(weight) => onChange({ weight })}
            unitLabel={unit}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={6}
            accessibilityLabel={`${t('training.weight')} (${unit})`}
          />
        </View>
        <View className="flex-1">
          <SetInput
            value={draft.reps}
            onChangeText={(reps) => onChange({ reps })}
            unitLabel={t('training.repsShort')}
            keyboardType="number-pad"
            placeholder={placeholder}
            maxLength={3}
            accessibilityLabel={t('training.reps')}
          />
        </View>
        {onOpenCalculator ? (
          <Pressable
            onPress={onOpenCalculator}
            accessibilityRole="button"
            accessibilityLabel={t('training.calculatorTitle')}
            className={[
              'h-12 w-10 items-center justify-center rounded-field border',
              detailActive ? 'border-info/40 bg-info/10' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <DumbbellIcon color={detailActive ? info : muted} size={18} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color={brandContrast} size={22} />
        </Pressable>
      </View>
      {caption ? <Text className="mt-1.5 text-xs text-ink-400">{caption}</Text> : null}
    </View>
  );
};

type CardProps = {
  workoutLogId: string;
  planned: PlannedSlot;
  sets: SetLog[];
  unit: Units;
  lastWeek: SetLog[];
  /** Newest working set of this exercise from any completed session (prefill). */
  lastSet: SetLog | null;
  /** Progression suggestion (kg) for the first set, when history supports one. */
  suggestedKg: number | null;
  /** How the exercise is loaded and whether each side is logged on its own. */
  facts: { equipment: Equipment | null; unilateral: boolean } | null;
  /** The owner's defaults for the exercise on the card (its last load config). */
  loadSetting: ExerciseSetting | null;
  userId: string;
  showArt: boolean;
  requestEffort: RequestEffort;
  onLogged: (info: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
    /** The row just written: the live query has not caught up yet. */
    logged: SetLog;
  }) => void;
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
  lastSet,
  suggestedKg: suggested,
  facts,
  loadSetting,
  userId,
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
  const { brand, muted } = useTheme();
  const [weightStep, setWeightStep] = useState(() => settings.getWeightStep());
  const [repsStep, setRepsStep] = useState(() => settings.getRepsStep());
  // Drafts live in a module store keyed by workoutLogId: switching exercises in
  // compact view (or leaving training mode) unmounts this card, and the typed
  // values must survive that.
  const drafts = useSessionDrafts(workoutLogId);
  const { warmup: warmupRows, extra: extraRows } = useSlotCounts(workoutLogId, planned.slotId);
  const [calcOpen, setCalcOpen] = useState(false);

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const warmups = sets.filter((s) => s.isWarmup);
  const doneCount = working.length;
  const planDone = doneCount >= rows.length;
  const totalRows = Math.max(rows.length, doneCount) + extraRows;
  const visualId = visualIdFor({ id: planned.exerciseId, name: planned.name });
  // Snapshots from before the badges key existed carry `undefined` — normalize
  // instead of letting the row read `.length` off nothing.
  const badges = sessionBadges(planned.badges);

  // Ramp toward the first working set, whatever that set is going to weigh.
  const firstWorkingKg = working[0]?.weightKg ?? lastSet?.weightKg ?? suggested;
  const ramp = warmupRamp(firstWorkingKg);
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

  /** Store keys carry the slotId so drafts from different exercises never mix. */
  const storeKey = (key: RowKey) => `${planned.slotId}:${key}`;

  const seedDraft = (key: RowKey): RowDraft => {
    if (key.startsWith('w')) {
      const fill = warmupPrefill(Number(key.slice(1)));
      return {
        weight: fill.weightKg != null ? weightText(fill.weightKg, unit) : '',
        reps: String(fill.reps),
        effort: null,
        load: null,
      };
    }
    const i = Number(key);
    // The set just completed seeds the next one; the newest past set / the
    // suggestion only apply before the first set of the exercise is logged.
    const fill = nextSetPrefill({
      logged: working,
      planReps: rows[i]?.reps,
      lastSet,
      suggestedKg: suggested,
    });
    return {
      weight: fill.weightKg != null ? weightText(fill.weightKg, unit) : '',
      reps: String(fill.reps),
      effort: null,
      load: fill.load,
    };
  };
  const draftFor = (key: RowKey): RowDraft => drafts.get(storeKey(key)) ?? seedDraft(key);
  // Typing (or ±) over the weight invalidates how it was built: only the sheet
  // writes `load`, and it always writes the matching text with it.
  const patchDraft = (key: RowKey, patch: Partial<RowDraft>) =>
    writeDraft(workoutLogId, storeKey(key), {
      ...draftFor(key),
      ...patch,
      ...('weight' in patch && !('load' in patch) ? { load: null } : {}),
    });

  const setWarmupRows = (n: number) =>
    writeSlotCounts(workoutLogId, planned.slotId, { warmup: Math.max(0, n), extra: extraRows });
  const setExtraRows = (n: number) =>
    writeSlotCounts(workoutLogId, planned.slotId, { warmup: warmupRows, extra: Math.max(0, n) });

  const bump = (field: 'weight' | 'reps', delta: number) => {
    if (!activeKey) return;
    const current = Number(draftFor(activeKey)[field]) || 0;
    // Weight keeps every typed decimal (no silent plate rounding); reps stay ≥ 1.
    const next =
      field === 'weight' ? bumpValue(current, delta) : String(Math.max(1, current + delta));
    patchDraft(activeKey, { [field]: next } as Partial<RowDraft>);
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
    const logged = logSet({
      workoutLogId,
      exerciseId: planned.exerciseId,
      weightKg,
      reps: r,
      load: reconcileLoad({
        draft: draft.load,
        setting: loadSetting?.load,
        weightKg,
        unilateral: facts?.unilateral,
      }),
      ...(isWarmup
        ? { isWarmup: true }
        : { rir: effort?.rir ?? null, isFailure: effort?.failure ?? false }),
    });
    clearDraft(workoutLogId, storeKey(key));
    if (isWarmup) {
      setWarmupRows(warmupRows - 1);
      return;
    }
    onLogged({
      restSeconds: planned.restSeconds ?? 120,
      slotId: planned.slotId,
      doneCount: doneCount + 1,
      logged,
    });
  };

  const pickEffort = async () => {
    if (!activeKey) return;
    const picked = await requestEffort();
    if (picked)
      patchDraft(activeKey, { effort: picked.rir == null && !picked.failure ? null : picked });
  };

  const swapIds = swapOptions(planned);
  const pickAlternative = () => {
    if (!swapIds.length) return;
    const options = swapIds
      .map((altId) => getExercise(altId))
      .filter((e): e is NonNullable<typeof e> => !!e);
    dialog.show({
      title: t('training.alternatives'),
      actions: [
        ...options.map((e) => ({
          label: e.name,
          onPress: () => {
            swapSnapshotExercise(workoutLogId, planned.slotId, e.id, e.name);
            clearDraftLoads(workoutLogId, planned.slotId);
          },
        })),
        { label: t('common.cancel'), style: 'cancel' as const },
      ],
    });
  };

  const activeDraft = activeKey ? draftFor(activeKey) : null;
  const activeRow = activeKey && !activeIsWarmup ? (rows[Number(activeKey)] ?? null) : null;
  const detailActive = hasLoadDetail(loadSetting);
  /** What the number in the row means, when it is not simply the total. */
  const rowCaption = (draft: RowDraft): string | null => {
    const value = Number(draft.weight);
    if (draft.weight === '' || !Number.isFinite(value)) return null;
    const draftDumbbell = draft.load?.kind === 'dumbbell' ? draft.load : null;
    if (draftDumbbell || loadSetting?.load?.kind === 'dumbbell') {
      const hands = draftDumbbell?.hands ?? defaultHands(facts?.unilateral);
      if (hands === 2)
        return t('load.perHandCaption', {
          perHand: draft.weight,
          // Already in the display unit; only the float noise of ×2 is trimmed.
          total: Math.round(value * 200) / 100,
          unit,
        });
      return t('load.perSideCaption', { value: draft.weight, unit });
    }
    if (facts?.unilateral) return t('load.perSideCaption', { value: draft.weight, unit });
    if (draft.load) return describeLoad(draft.load, unit).parts;
    return null;
  };

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
        </Pressable>
        {/* A visible swap icon beside the guide, not a "hold for alternatives"
            hint line; the long-press on the name still works. */}
        <View className="flex-row items-center gap-1">
          {swapIds.length ? (
            <Pressable
              onPress={pickAlternative}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('training.alternatives')}
              className="h-8 w-8 items-center justify-center"
            >
              <SwapIcon color={muted} size={17} />
            </Pressable>
          ) : null}
          <ExerciseDocButton exerciseId={planned.exerciseId} size={17} />
        </View>
      </View>

      {/* Cues and facts share ONE line — a second strip pushed the sets down. */}
      {badges.length || facts?.unilateral ? (
        <View className="mt-2">
          <BadgeRow
            mono
            tone="brand"
            items={[
              ...badges.map((b, i) => ({ value: `${b}-${i}`, label: b })),
              ...(facts?.unilateral
                ? [
                    {
                      value: 'unilateral',
                      label: t('training.unilateral'),
                      tone: 'info' as const,
                      mono: false,
                    },
                  ]
                : []),
            ]}
          />
          {facts?.unilateral ? (
            <Text className="mt-1 text-xs leading-4 text-ink-400">
              {t('training.unilateralHint')}
            </Text>
          ) : null}
        </View>
      ) : null}

      <SessionNotes slotNote={planned.notes} exerciseId={planned.exerciseId} />

      {lastWeek.length ? (
        <View className="mt-2 flex-row items-center">
          <Text className="text-xs text-ink-400">{t('training.lastWeek')}: </Text>
          <ConvertibleWeight kg={lastWeek[0].weightKg} unit={unit} />
          <Text className="text-xs text-ink-400"> × {lastWeek.map((s) => s.reps).join(',')}</Text>
        </View>
      ) : null}

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
              onRemove={() => setWarmupRows(warmupRows - 1)}
              onOpenCalculator={() => setCalcOpen(true)}
              detailActive={detailActive}
              caption={rowCaption(activeDraft)}
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
          const legend = row ? targetLine(row, t) : null;
          if (key !== activeKey || activeIsWarmup) {
            return <PendingRow key={key} label={String(i + 1)} legend={legend} />;
          }
          return (
            <ActiveRow
              key={key}
              label={t('training.setN', { n: i + 1 })}
              legend={legend}
              draft={draftFor(key)}
              unit={unit}
              placeholder={row ? `${row.reps}${row.repsMax ? `-${row.repsMax}` : ''}` : '0'}
              onChange={(patch) => patchDraft(key, patch)}
              onConfirm={() => void confirm(key)}
              onOpenCalculator={() => setCalcOpen(true)}
              detailActive={detailActive}
              caption={rowCaption(draftFor(key))}
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
          onPress={() => setWarmupRows(warmupRows + 1)}
          accessibilityRole="button"
          className="flex-row items-center gap-1 py-1.5"
        >
          <PlusIcon color={muted} size={14} />
          <Text className="text-xs font-sans-semibold text-ink-400">{t('training.warmupSet')}</Text>
        </Pressable>
        {/* Extra sets only unlock once the plan is done — sets have an order. */}
        {planDone ? (
          <Pressable
            onPress={() => setExtraRows(extraRows + 1)}
            accessibilityRole="button"
            className="flex-row items-center gap-1 py-1.5"
          >
            <PlusIcon color={brand} size={14} />
            <Text className="text-xs font-sans-semibold text-brand">{t('training.extraSet')}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* The load sheet applies straight into the live row's draft, and a
          changed setup is remembered on the exercise for the next session. */}
      <WeightCalculatorSheet
        visible={calcOpen}
        onClose={() => setCalcOpen(false)}
        unit={unit}
        initialWeight={activeDraft?.weight ?? ''}
        initialLoad={activeDraft?.load ?? loadSetting?.load ?? null}
        equipment={facts?.equipment ?? null}
        unilateral={!!facts?.unilateral}
        onApply={({ weightText, load, changed }) => {
          if (!activeKey) return;
          patchDraft(activeKey, { weight: weightText, load });
          if (changed && load) upsertExerciseSetting(userId, planned.exerciseId, { load });
        }}
      />
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
  const { brand, brandContrast, muted, danger } = useTheme();
  // The unmount can outlive the Activity (process killed, reload, OS teardown);
  // releasing the lock then rejects, and there is nothing left to keep awake.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });

  // Live, so a swap or a routine edit landing in the snapshot re-renders the
  // cards; the sync read covers the first frame before the query resolves.
  const logId = typeof id === 'string' ? id : '';
  const { data: logRows } = useLiveQuery(workoutQuery(logId), [logId]);
  const log = logRows[0] ?? (logId ? getWorkout(logId) : null);
  const workoutDayId = log?.workoutDayId ?? null;

  // A rest left behind by another session is stale: drop it and its notification.
  useEffect(() => {
    const current = restState.get();
    if (current && current.workoutId !== id) void endRest();
  }, [id]);

  const { units: unit, setUnits } = useUnits();
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
  // The screen is singular per workout (`workoutScreenId`), so a later push —
  // the rest notification's `?slot=` — lands on this instance with new params
  // instead of mounting a copy. Follow it: focus the card in compact view…
  const [seenSlot, setSeenSlot] = useState(focusSlot);
  if (focusSlot !== seenSlot) {
    setSeenSlot(focusSlot);
    const i = (log?.plannedSnapshot ?? []).findIndex((p) => p.slotId === focusSlot);
    if (i >= 0) setCardIndex(i);
  }
  // One effort sheet serves every set row; the row awaits the resolver. If the
  // screen unmounts mid-pick (tab switch), resolve null so no await hangs.
  const [effortResolve, setEffortResolve] = useState<((e: Effort | null) => void) | null>(null);
  const effortResolveRef = useRef<((e: Effort | null) => void) | null>(null);
  useEffect(() => {
    return () => effortResolveRef.current?.(null);
  }, []);
  const activeRest = useActiveRest();
  const rest = activeRest?.workoutId === log?.id ? activeRest : null;
  const scrollRef = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const cardY = useRef(new Map<string, number>());
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [finishing, setFinishing] = useState(false);

  const day = workoutDayId ? getWorkoutDay(workoutDayId) : null;
  const { data: sets } = useLiveQuery(setLogsQuery(typeof id === 'string' ? id : ''), [id]);

  // Prefill sources per snapshot slot, keyed by the exercise ON the slot and
  // re-read when a slot swaps exercise, so a variant never inherits another
  // variant's loads. "Last week" feeds the card's reference line; the newest
  // logged set of the exercise seeds the first row.
  const prefillKey = prefillSourceKey(log?.plannedSnapshot ?? []);
  const lastWeekBySlot = useMemo(() => {
    if (!log?.plannedSnapshot || !workoutDayId) return new Map<string, SetLog[]>();
    return new Map(
      log.plannedSnapshot.map((p) => [
        p.slotId,
        lastWeekSets(p.exerciseId, workoutDayId, log.weekNumber - 1),
      ]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.id, prefillKey]);
  const lastSetBySlot = useMemo(() => {
    if (!log?.plannedSnapshot) return new Map<string, SetLog | null>();
    return new Map(log.plannedSnapshot.map((p) => [p.slotId, lastLoggedSet(p.exerciseId)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.id, prefillKey]);
  // What each card needs to know about its exercise beyond the snapshot, keyed
  // by the exercise ON the slot (never the slot): a swap shows the variant's
  // own tag and its own saved load. Deps are load-bearing (AGENTS.md).
  const exerciseIds = (log?.plannedSnapshot ?? []).map((p) => p.exerciseId);
  const { data: factRows } = useLiveQuery(exerciseFactsQuery(exerciseIds), [prefillKey]);
  const { data: settingRows } = useLiveQuery(exerciseSettingsQuery(user?.id ?? '', exerciseIds), [
    user?.id,
    prefillKey,
  ]);
  const factsById = new Map(factRows.map((r) => [r.id, r]));
  const settingById = new Map(settingRows.map((r) => [r.exerciseId, r]));
  // Lifted out of the card so the notification's "next load" is the same
  // number the row will open with.
  const suggestedBySlot = useMemo(() => {
    if (!log?.plannedSnapshot) return new Map<string, number | null>();
    return new Map(
      log.plannedSnapshot.map((p) => [
        p.slotId,
        suggestedWeight(p.exerciseId, p.setGroups[0]?.reps ?? 8, 2),
      ]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log?.id, prefillKey]);

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

  // …and scroll to it in list view (its card already laid out, so the mount-time
  // `focused` onLayout will not fire again).
  useEffect(() => {
    if (!focusSlot) return;
    const y = cardY.current.get(focusSlot);
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  }, [focusSlot]);

  const workingSetsFor = (exerciseId: string) =>
    sets.filter((s) => !s.isWarmup && s.exerciseId === exerciseId);
  const doneFor = (exerciseId: string) => workingSetsFor(exerciseId).length;

  /**
   * The next set as frozen copy for the notification: what the card will show
   * once the lifter gets there, prefilled by the same chain the row uses.
   * `justLogged` is folded in because the live query lags the write by a tick.
   */
  const nextSetCopy = (
    planned: PlannedSlot[],
    upcoming: NextSet,
    justLogged?: SetLog,
  ): NextSetCopy | null => {
    if (upcoming.kind === 'done') return null;
    const slot = planned.find((p) => p.slotId === upcoming.slotId);
    if (!slot) return null;
    const row = expandRows(slot.setGroups, t)[upcoming.setNumber - 1];
    const logged = workingSetsFor(slot.exerciseId);
    if (justLogged?.exerciseId === slot.exerciseId && !logged.some((s) => s.id === justLogged.id))
      logged.push(justLogged);
    const fill = nextSetPrefill({
      logged,
      planReps: row?.reps,
      lastSet: lastSetBySlot.get(slot.slotId) ?? null,
      suggestedKg: suggestedBySlot.get(slot.slotId) ?? null,
    });
    return {
      slotId: slot.slotId,
      exerciseName: slot.name,
      setLabel: t('session.setOf', { n: upcoming.setNumber, total: upcoming.setTotal }),
      targetLabel: row ? targetLine(row, t) : '',
      weightLabel: fill.weightKg != null ? `${weightText(fill.weightKg, unit)} ${unit}` : '',
    };
  };

  const sessionRecord = (workout: WorkoutLog, next: NextSetCopy | null): ActiveSession => ({
    workoutId: workout.id,
    startedAt: workout.startedAt.getTime(),
    title: t('session.notifTitle'),
    next,
    doneLabel: t('training.restLast'),
  });

  // The "training in progress" notification lives from the first visit until
  // finish/abandon — deliberately NOT torn down on unmount: leaving the screen
  // (tab switch) does not end the session, and the check-in delay reads it.
  const liveWorkoutId = log?.status === 'in_progress' ? log.id : null;
  useEffect(() => {
    if (!liveWorkoutId || sessionState.get()?.workoutId === liveWorkoutId) return;
    const started = getWorkout(liveWorkoutId);
    if (!started) return;
    void ensureNotificationPermission().finally(() => {
      // The permission prompt can outlast the session: a quick finish/abandon
      // ends it first, and showing now would resurrect a notification (and
      // session record) for a workout that is already over.
      if (getWorkout(started.id)?.status !== 'in_progress') return;
      // The first face names the first open set; every logged set redraws it.
      const snapshot = started.plannedSnapshot ?? [];
      const first = nextSetSummary(snapshot, '', 0, doneFor);
      void showSession(sessionRecord(started, nextSetCopy(snapshot, first)));
    });
    // The helpers close over the live sets and prefill maps: a stale read on
    // this one-time draw is corrected by the first logged set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWorkoutId, t]);

  // The OS may kill the foreground service alone and take the card with it;
  // a re-post of the current face is idempotent and cheap.
  useEffect(() => {
    if (!liveWorkoutId) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && sessionState.get()?.workoutId === liveWorkoutId) void redrawSession();
    });
    return () => sub.remove();
  }, [liveWorkoutId]);

  if (!user || !log || log.status !== 'in_progress') return <Redirect href="/training" />;

  const planned = log.plannedSnapshot ?? [];
  const listOrder = [...planned.filter((p) => !doneSlot(p)), ...planned.filter(doneSlot)];

  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);

  const totalPlannedSets = planned.reduce(
    (sum, p) => sum + p.setGroups.reduce((x, g) => x + g.sets, 0),
    0,
  );
  const doneSets = sets.filter((s) => !s.isWarmup).length;
  const progress = totalPlannedSets ? Math.min(1, doneSets / totalPlannedSets) : 0;

  const requestEffort: RequestEffort = () =>
    new Promise((resolve) => {
      const resolver = (e: Effort | null) => {
        resolve(e);
        effortResolveRef.current = null;
        setEffortResolve(null);
      };
      effortResolveRef.current = resolver;
      setEffortResolve(() => resolver);
    });

  // Copy is frozen here (an event, not render) so the one notification can be
  // redrawn headlessly without i18n. The session face is written first and the
  // rest layered on it, so the card never shows a stale next set mid-rest.
  const onLogged = ({
    restSeconds,
    slotId,
    doneCount,
    logged,
  }: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
    logged: SetLog;
  }) => {
    const startedAt = Date.now();
    const upcoming = nextSetSummary(planned, slotId, doneCount, doneFor);
    const record = sessionRecord(log, nextSetCopy(planned, upcoming, logged));
    const restPayload = {
      workoutId: log.id,
      slotId,
      startedAt,
      endsAt: startedAt + restSeconds * 1000,
      copy: {
        restingTitle: t('training.restOngoingTitle'),
        overTitle: t('training.restDoneTitle'),
        skipLabel: t('training.skip'),
        readyLabel: t('training.restReady'),
        plus30Label: t('training.restPlus30'),
        plus60Label: t('training.restPlus1'),
      },
    };
    void showSession(record).finally(() =>
      ensureNotificationPermission().finally(() => startRest(restPayload)),
    );
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
      closeSession('finish', log.id, log.userId);
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
        closeSession('abandon', log.id, log.userId);
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

  // The unit toggle lives in the pinned session strip (never in the top bar,
  // never scrolling away), and the choice is a per-user preference: Settings
  // edits the same key, so persist every toggle.
  const changeUnit = (next: Units) => {
    setUnits(next);
    pushProfile(user);
  };

  const idx = Math.min(cardIndex, Math.max(0, planned.length - 1));
  const current = planned[idx] ?? null;

  // Ordered exercise strip (both layouts): tap focuses the exercise in compact
  // view, or scrolls to its card in list view — the compact Select is gone.
  const jumpToExercise = (index: number) => {
    const target = planned[index];
    if (!target) return;
    if (layout === 'cards') {
      setCardIndex(index);
      return;
    }
    const y = cardY.current.get(target.slotId);
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  const exerciseChips =
    planned.length > 1 ? (
      <View className="mb-3">
        <ChipRow
          items={planned.map((p, i) => ({
            value: String(i),
            label: `${i + 1}. ${p.name}`,
            done: doneSlot(p),
          }))}
          value={layout === 'cards' ? String(idx) : null}
          onChange={(v) => jumpToExercise(Number(v))}
        />
      </View>
    ) : null;

  const renderCard = (p: PlannedSlot, focused: boolean) => (
    <View key={p.slotId} onLayout={(e) => cardY.current.set(p.slotId, e.nativeEvent.layout.y)}>
      <ExerciseCard
        workoutLogId={log.id}
        planned={p}
        sets={setsFor(p.exerciseId)}
        unit={unit}
        lastWeek={lastWeekBySlot.get(p.slotId) ?? []}
        lastSet={lastSetBySlot.get(p.slotId) ?? null}
        suggestedKg={suggestedBySlot.get(p.slotId) ?? null}
        facts={factsById.get(p.exerciseId) ?? null}
        loadSetting={settingById.get(p.exerciseId) ?? null}
        userId={user.id}
        showArt={showArt}
        requestEffort={requestEffort}
        onLogged={onLogged}
        focused={focused}
        onFocusLayout={(y) =>
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: false })
        }
      />
    </View>
  );

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={day ? dayDisplayName(day, t) : t('training.workout')}
          subtitle={t('training.weekN', { n: log.weekNumber })}
          right={
            // Finish sits in the corner, where a confirming check is looked for;
            // abandon steps inward. Both still confirm before acting.
            <View className="flex-row items-center gap-2">
              <Pressable
                hitSlop={8}
                onPress={cancel}
                accessibilityRole="button"
                accessibilityLabel={t('training.cancelWorkout')}
                className="h-9 w-9 items-center justify-center rounded-full bg-ink-800"
              >
                <XIcon color={danger} size={18} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={finish}
                accessibilityRole="button"
                accessibilityLabel={t('training.finish')}
                className="h-9 w-9 items-center justify-center rounded-full bg-brand"
              >
                <CheckIcon color={brandContrast} size={18} />
              </Pressable>
            </View>
          }
        />
      }
    >
      {/* Pinned session strip, stays put while the sets scroll. Split and week
       * live in the top bar, so it costs two compact rows. */}
      <View className="px-5 pb-3 pt-1">
        <View className="flex-row items-center gap-3">
          <View className="h-1 flex-1 overflow-hidden rounded-full bg-ink-800">
            <View
              className="h-full rounded-full bg-brand"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <View className="flex-row items-center gap-2">
            <ElapsedClock startedAt={log.startedAt} />
            <Text className="text-xs text-ink-600">·</Text>
            <Text className="font-mono-medium text-xs tabular-nums text-ink-300">
              {t('training.setsOf', { done: doneSets, total: totalPlannedSets })}
            </Text>
          </View>
        </View>
        {/* The unit toggle is pinned here, never in the top bar. */}
        <View className="mt-2.5 flex-row items-center justify-between gap-2">
          <View className="w-28">
            <SegmentedControl segments={UNIT_SEGMENTS} value={unit} onChange={changeUnit} />
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
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-5 pb-2"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exerciseChips}

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
            <Text className="mb-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {t('training.exerciseOf', { n: idx + 1, total: planned.length })}
            </Text>
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
