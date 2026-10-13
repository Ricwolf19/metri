import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Modal, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DragHandleIcon,
  FlameIcon,
  PlusIcon,
  ShareIcon,
  SwapIcon,
  XIcon,
} from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  Button,
  BadgeRow,
  BlockingOverlay,
  Card,
  ChipRow,
  IconButton,
  ReorderRow,
  Screen,
  ScreenTitle,
  ScrollArea,
  SegmentedControl,
  OptionSheet,
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
import { ExerciseDocButton } from '@/features/training/components/ExerciseDocButton';
import { ActiveSetRow } from '@/features/training/components/ActiveSetRow';
import { ExerciseFrames } from '@/features/training/components/ExerciseFrames';
import { MachineLoadChooser } from '@/features/training/components/MachineLoadChooser';
import { LastTraining } from '@/features/training/components/LastTraining';
import { LoggedRow, PendingRow } from '@/features/training/components/SetRows';
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
import { exerciseDisplayName } from '@/features/training/labels';
import { visualIdFor } from '@/features/training/exercise-visuals';
import {
  exerciseSettingsQuery,
  upsertExerciseSetting,
} from '@/features/training/exercise-settings.repo';
import {
  defaultHands,
  deriveLoad,
  hasLoadDetail,
  kgToUnit,
  machineLoadKind,
  PLATE_MACHINE_SEED,
  POST_MACHINE_SEED,
  clampInput,
  type MachineKind,
  reconcileLoad,
  rowInputMode,
  type LoadDetail,
} from '@/features/training/load';
import { sideStep, sideTextFromTotal, totalFromSide } from '@/features/training/plate-math';
import { getWorkoutDay } from '@/features/training/programs.repo';
import { getRoutine } from '@/features/training/authoring.repo';
import { fromKg, isRmTestWeek } from '@/features/training/progression';
import { closeSession } from '@/features/training/close-session';
import { sessionShareModel } from '@/features/share/models';
import { ShareSheet } from '@/features/share/ShareSheet';
import {
  bumpValue,
  compareToPrevious,
  nextSetPrefill,
  previousSetFor,
  weightText,
} from '@/features/training/set-prefill';
import { badgeLabel } from '@/features/training/programs/badge-copy';
import { sessionBadges } from '@/features/training/session-badges';
import {
  clearDraft,
  clearDraftLoads,
  readSessionDrafts,
  useSessionDrafts,
  useSlotCounts,
  writeDraft,
  writeSlotCounts,
  type Effort,
  type RowDraft,
} from '@/features/training/workout-drafts';
import {
  getWorkout,
  workoutQuery,
  logSet,
  previousSessionSets,
  reorderSnapshot,
  sessionSummary,
  setLogsQuery,
  setWarmupDone,
  suggestedWeight,
  swapSnapshotExercise,
  type PreviousSession,
  type SessionSummary,
} from '@/features/training/session.repo';
import { prefillSourceKey, swapOptions } from '@/features/training/variants';
import { useI18n, useT, type TFunction } from '@/i18n';
import { formatNumber, parseDecimal, parseInteger, roundHalf, snapTo } from '@/lib/numbers';
import { settings, type Units } from '@/lib/storage';
import { playSound } from '@/lib/sounds';
import { UNIT_SEGMENTS, useUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

// Lets the blocking overlay paint before the synchronous finish work.
const OVERLAY_PAINT_MS = 50;

/** The ± jumps on offer: plate-sized for the weight, small for the reps. */
const WEIGHT_STEPS = [0.5, 1, 1.25, 2.5, 5, 10];
const REPS_STEPS = [1, 2, 3, 4, 5];

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

type CardProps = {
  workoutLogId: string;
  planned: PlannedSlot;
  sets: SetLog[];
  unit: Units;
  /** The previous completed session of this exercise (prefill + "Last training"). */
  previous: PreviousSession | null;
  /** Progression suggestion (kg) for the first set, when history supports one. */
  suggestedKg: number | null;
  /** How the exercise is loaded and whether each side is logged on its own. */
  facts: { equipment: Equipment | null; unilateral: boolean } | null;
  /** The owner's defaults for the exercise on the card (its last load config). */
  loadSetting: ExerciseSetting | null;
  userId: string;
  requestEffort: RequestEffort;
  onLogged: (info: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
    /** The row just written: the live query has not caught up yet. */
    logged: SetLog;
  }) => void;
};

const ExerciseCard = ({
  workoutLogId,
  planned,
  sets,
  unit,
  previous,
  suggestedKg: suggested,
  facts,
  loadSetting,
  userId,
  requestEffort,
  onLogged,
}: CardProps) => {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { brand, muted } = useTheme();
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [weightStep, setWeightStep] = useState(() => settings.getWeightStep());
  const [repsStep, setRepsStep] = useState(() => settings.getRepsStep());
  // Drafts live in a module store keyed by workoutLogId: paging to another
  // exercise (or leaving training mode) unmounts this card, and the typed
  // values must survive that.
  const drafts = useSessionDrafts(workoutLogId);
  const { extra: extraRows } = useSlotCounts(workoutLogId, planned.slotId);
  const [calcOpen, setCalcOpen] = useState(false);

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const doneCount = working.length;
  const planDone = doneCount >= rows.length;
  const totalRows = Math.max(rows.length, doneCount) + extraRows;
  // Snapshots from before the badges key existed carry `undefined` — normalize
  // instead of letting the row read `.length` off nothing.
  const badges = sessionBadges(planned.badges);

  const previousSets = previous?.sets ?? [];
  // What the weight field holds: per side on a plate-loaded exercise (bar, or a
  // machine the lifter marked as plates), one dumbbell, else the total. The
  // draft's `weight` is always the total; `side` is presentation on top of it.
  const inputMode = rowInputMode(facts, loadSetting?.load);
  const perSide = inputMode.mode === 'perSide' ? inputMode : null;
  const baseInUnit = perSide ? kgToUnit(perSide.baseKg, unit) : 0;
  const sideOf = (draft: RowDraft): string =>
    draft.side ?? (perSide ? sideTextFromTotal(draft.weight, baseInUnit, perSide.sides) : '');
  /** The detail the row's number describes, in the current input mode. */
  const deriveFor = (draft: RowDraft): LoadDetail | null =>
    deriveLoad({
      mode: inputMode,
      value: parseDecimal(perSide ? sideOf(draft) : draft.weight),
      unit,
      setting: loadSetting?.load,
      current: draft.load,
      unilateral: facts?.unilateral,
    });
  // A machine the lifter has not yet described: plates or a pin stack decides
  // what the row asks for, so the card asks first.
  const needsMachineKind =
    facts?.equipment === 'machine' && machineLoadKind(loadSetting?.load) === null;
  const activeKey: RowKey | null = doneCount < totalRows ? `${doneCount}` : null;

  /** Store keys carry the slotId so drafts from different exercises never mix. */
  const storeKey = (key: RowKey) => `${planned.slotId}:${key}`;

  /** A seeded row's detail: the previous one when it still describes the number, else derived. */
  const seededLoad = (draft: RowDraft, carried: LoadDetail | null): LoadDetail | null =>
    // Per side is always re-derived against the CURRENT base (the bar may differ).
    perSide ? deriveFor(draft) : (carried ?? deriveFor(draft));
  const seedDraft = (key: RowKey): RowDraft => {
    const i = Number(key);
    // Set i of the previous session of this exercise seeds set i here; the set
    // just completed and the suggestion only apply with no history.
    const fill = nextSetPrefill({
      index: i,
      planReps: rows[i]?.reps,
      previous: previousSets,
      logged: working,
      suggestedKg: suggested,
    });
    const draft: RowDraft = {
      weight: fill.weightKg != null ? weightText(fill.weightKg, unit) : '',
      reps: String(fill.reps),
      effort: null,
      load: null,
    };
    return { ...draft, load: seededLoad(draft, fill.load) };
  };
  const draftFor = (key: RowKey): RowDraft => drafts.get(storeKey(key)) ?? seedDraft(key);
  // The store, not the render snapshot: two writes in one handler (snap, then
  // log) must each see the other.
  const freshDraft = (key: RowKey): RowDraft =>
    readSessionDrafts(workoutLogId).get(storeKey(key)) ?? seedDraft(key);
  // Every change to the number re-derives how it is built (`deriveLoad`), so a
  // ± tap keeps the plates; the sheet is the one caller that hands its own `load`.
  const patchDraft = (key: RowKey, patch: Partial<RowDraft>) => {
    const next = { ...freshDraft(key), ...patch };
    // A typed total or per-hand number stops at the cap (per-side is capped in `setSide`).
    if ('weight' in patch && !('side' in patch) && !perSide) {
      const typed = parseDecimal(next.weight);
      if (typed != null) {
        const capped = clampInput(inputMode.mode, typed, unit);
        if (capped !== typed) next.weight = formatNumber(capped, 3);
      }
    }
    const renumbered = ('weight' in patch || 'side' in patch) && !('load' in patch);
    writeDraft(workoutLogId, storeKey(key), renumbered ? { ...next, load: deriveFor(next) } : next);
  };
  /** Per-side typing: the total follows. */
  const setSide = (key: RowKey, text: string) => {
    const typed = parseDecimal(text);
    const side = typed == null ? null : clampInput('perSide', typed, unit);
    patchDraft(key, {
      side: side == null || side === typed ? text : formatNumber(side, 3),
      weight:
        side == null ? '' : formatNumber(totalFromSide(side, baseInUnit, perSide?.sides ?? 2), 3),
    });
  };
  /**
   * The typed number onto what exists: a side to the smallest plate, one
   * dumbbell to the half; the total of a stack or a plain number is left as
   * typed. Silent — this IS the rounding the lifter expects, not a correction.
   */
  const snapDraft = (key: RowKey) => {
    const draft = freshDraft(key);
    if (perSide) {
      const side = parseDecimal(sideOf(draft));
      if (side == null) return;
      const snapped = snapTo(side, sideStep(unit));
      if (snapped !== side) setSide(key, formatNumber(snapped, 3));
      return;
    }
    if (inputMode.mode === 'perHand') {
      const w = parseDecimal(draft.weight);
      if (w == null) return;
      const snapped = roundHalf(w);
      if (snapped !== w) patchDraft(key, { weight: formatNumber(snapped, 3) });
    }
  };

  const setExtraRows = (n: number) =>
    writeSlotCounts(workoutLogId, planned.slotId, { extra: Math.max(0, n) });

  const bump = (field: 'weight' | 'reps', delta: number) => {
    if (!activeKey) return;
    const draft = freshDraft(activeKey);
    // On a plate-loaded row the ± steps the SIDE: that is the number in hand,
    // and the total plus its plates follow from it.
    if (field === 'weight' && perSide) {
      setSide(activeKey, bumpValue(parseDecimal(sideOf(draft)) ?? 0, delta));
      return;
    }
    const current = parseDecimal(draft[field]) ?? 0;
    // Weight keeps every typed decimal (no silent plate rounding); reps stay ≥ 1.
    const next =
      field === 'weight' ? bumpValue(current, delta) : String(Math.max(1, current + delta));
    patchDraft(activeKey, { [field]: next } as Partial<RowDraft>);
  };

  const confirm = async (key: RowKey) => {
    // The check is tapped without leaving the field, so the blur snap runs here too.
    snapDraft(key);
    const draft = freshDraft(key);
    const index = Number(key);
    const w = parseDecimal(draft.weight);
    // Reps are whole: a "8.5" is a typo, not half a rep.
    const r = parseInteger(draft.reps);
    if (w == null) {
      toast.error(t('training.needWeight'));
      return;
    }
    if (r == null || r <= 0) {
      toast.error(t('training.needReps'));
      return;
    }
    // A prescription that measures effort is not logged without it: the RIR
    // chip in the action bar picks it, the check only reminds.
    const effort = draft.effort;
    if (rows[index]?.wantsEffort && !effort) {
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
      rir: effort?.rir ?? null,
      isFailure: effort?.failure ?? false,
    });
    clearDraft(workoutLogId, storeKey(key));
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

  // The variant picker is the shared Select, listing the exercise on the card
  // first and every alternative after it; picking one swaps the snapshot slot.
  const swapIds = swapOptions(planned);
  const variantItems = [planned.exerciseId, ...swapIds].flatMap((id) => {
    const e = getExercise(id);
    return e ? [{ value: id, label: exerciseDisplayName(e, locale) }] : [];
  });
  const pickVariant = (id: string) => {
    if (id === planned.exerciseId) return;
    const e = getExercise(id);
    if (!e) return;
    swapSnapshotExercise(workoutLogId, planned.slotId, e.id, e.name);
    clearDraftLoads(workoutLogId, planned.slotId);
  };

  const activeDraft = activeKey ? draftFor(activeKey) : null;
  const activeRow = activeKey ? (rows[Number(activeKey)] ?? null) : null;
  const detailActive = hasLoadDetail(loadSetting);
  /** The typed values against the same set last time; nothing for warm-ups or without history. */
  const trendsFor = (key: RowKey, draft: RowDraft) => {
    const none = { weight: null, reps: null };
    const ref = previousSetFor(previousSets, Number(key));
    if (!ref) return none;
    const typed = parseDecimal(draft.weight);
    const typedKg = typed == null ? null : unit === 'lb' ? lbToKg(typed) : typed;
    return {
      weight: compareToPrevious(typedKg, ref.weightKg, 0.02),
      reps: compareToPrevious(parseInteger(draft.reps), ref.reps),
    };
  };
  /** What the number in the row means when it is not simply the total, and how it is built. */
  const rowCaption = (draft: RowDraft): { text: string | null; breakdown: LoadDetail | null } => {
    const value = parseDecimal(draft.weight);
    if (value == null) return { text: null, breakdown: null };
    const draftDumbbell = draft.load?.kind === 'dumbbell' ? draft.load : null;
    if (draftDumbbell || loadSetting?.load?.kind === 'dumbbell') {
      const hands = draftDumbbell?.hands ?? defaultHands(facts?.unilateral);
      const text =
        hands === 2
          ? t('load.perHandCaption', {
              perHand: draft.weight,
              // Already in the display unit; only the float noise of ×2 is trimmed.
              total: Math.round(value * 200) / 100,
              unit,
            })
          : t('load.perSideCaption', { value: draft.weight, unit });
      return { text, breakdown: null };
    }
    const breakdown = draft.load ?? null;
    // Per side typed → the total is the derived number worth reading back.
    if (perSide) return { text: `${t('training.total')} ${draft.weight} ${unit}`, breakdown };
    if (facts?.unilateral)
      return { text: t('load.perSideCaption', { value: draft.weight, unit }), breakdown };
    return { text: null, breakdown };
  };
  /** The per-side field for `ActiveSetRow`, on plate-loaded rows only. */
  const sideInputFor = (key: RowKey, draft: RowDraft) =>
    perSide
      ? {
          baseLabel: formatNumber(baseInUnit, 2),
          sides: perSide.sides,
          value: sideOf(draft),
          onChange: (text: string) => setSide(key, text),
        }
      : undefined;
  // Plates write their seed at once; a stack needs base + pins, so it opens the sheet.
  const chooseMachineKind = (kind: MachineKind) => {
    if (kind === 'stack') {
      setCalcOpen(true);
      return;
    }
    upsertExerciseSetting(userId, planned.exerciseId, {
      load: kind === 'post' ? POST_MACHINE_SEED : PLATE_MACHINE_SEED,
    });
  };

  const visualId = visualIdFor({ id: planned.exerciseId, name: planned.name });

  return (
    <Card className="mb-3">
      {/* The movement first, as a still: what to do reads faster than its name. */}
      {visualId ? (
        <View className="mb-3">
          <ExerciseFrames visualId={visualId} accessibilityLabel={planned.name} autoplay={false} />
        </View>
      ) : null}
      <View className="flex-row items-start">
        <Pressable
          onPress={() =>
            router.push({ pathname: '/training/exercise/[id]', params: { id: planned.exerciseId } })
          }
          accessibilityRole="button"
          className="flex-1 pr-2"
        >
          <Text className="text-base font-sans-semibold text-ink-50">{planned.name}</Text>
        </Pressable>
        {/* The swap glyph opens the variant list (the shared option sheet). */}
        <View className="flex-row items-center gap-1">
          {swapIds.length ? (
            <Pressable
              onPress={() => setVariantsOpen(true)}
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
      <OptionSheet
        visible={variantsOpen}
        onClose={() => setVariantsOpen(false)}
        label={t('training.alternatives')}
        items={variantItems}
        value={planned.exerciseId}
        onChange={pickVariant}
      />

      {/* Cues and facts share ONE line — a second strip pushed the sets down. */}
      {badges.length || facts?.unilateral ? (
        <View className="mt-2">
          <BadgeRow
            mono
            tone="brand"
            items={[
              ...badges.map((b, i) => ({ value: `${b}-${i}`, label: badgeLabel(b, locale) })),
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

      {previous?.sets.length ? <LastTraining previous={previous} unit={unit} /> : null}

      {/* Asked once per machine, before the first number: plates and a pin stack
          are different rows (per side vs total) and different pictures. */}
      {needsMachineKind ? (
        <View className="mt-3 rounded-field border border-ink-700 bg-ink-850 px-3 py-2.5">
          <MachineLoadChooser value={null} onChange={chooseMachineKind} />
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
          if (key !== activeKey) {
            return <PendingRow key={key} label={String(i + 1)} legend={legend} />;
          }
          const draft = draftFor(key);
          const trend = trendsFor(key, draft);
          const cap = rowCaption(draft);
          return (
            <ActiveSetRow
              key={key}
              label={t('training.setN', { n: i + 1 })}
              legend={legend}
              draft={draft}
              unit={unit}
              placeholder={row ? `${row.reps}${row.repsMax ? `-${row.repsMax}` : ''}` : '0'}
              onChange={(patch) => patchDraft(key, patch)}
              onConfirm={() => void confirm(key)}
              onOpenCalculator={() => setCalcOpen(true)}
              detailActive={detailActive}
              caption={cap.text}
              breakdown={cap.breakdown}
              weightTrend={trend.weight}
              repsTrend={trend.reps}
              side={sideInputFor(key, draft)}
              onBlurWeight={() => snapDraft(key)}
            />
          );
        })}
      </View>

      {/* One control bar per card, always in the same place, driving the live row. */}
      {activeKey && activeDraft ? (
        <View className="mt-2.5 flex-row items-end gap-2 border-t border-ink-800 pt-2.5">
          <StepGroup
            accessibilityLabel={`${t('training.weight')} (${unit})`}
            steps={WEIGHT_STEPS}
            step={weightStep}
            onStepChange={(n) => {
              settings.setWeightStep(n);
              setWeightStep(n);
            }}
            onBump={(d) => bump('weight', d)}
          />
          <View className="w-px self-stretch bg-ink-800" />
          <StepGroup
            accessibilityLabel={t('training.reps')}
            steps={REPS_STEPS}
            step={repsStep}
            onStepChange={(n) => {
              settings.setRepsStep(n);
              setRepsStep(n);
            }}
            onBump={(d) => bump('reps', d)}
          />
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
        </View>
      ) : null}

      <View className="mt-2 flex-row items-center justify-center gap-4">
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
        preferMode={needsMachineKind ? 'machine' : undefined}
        onApply={({ weightText, load, changed }) => {
          if (!activeKey) return;
          // `side` is dropped on purpose: the sheet may have changed the base,
          // and the row re-splits the total over the base it renders with.
          patchDraft(activeKey, { weight: weightText, load, side: undefined });
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
  const { brandContrast, muted, danger } = useTheme();
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
  const [reordering, setReordering] = useState(false);
  const [orderDraft, setOrderDraft] = useState<PlannedSlot[]>([]);
  const [cardIndex, setCardIndex] = useState(() => {
    const snapshot = typeof id === 'string' ? (getWorkout(id)?.plannedSnapshot ?? []) : [];
    const i = focusSlot ? snapshot.findIndex((p) => p.slotId === focusSlot) : -1;
    return Math.max(0, i);
  });
  // The screen is singular per workout (`workoutScreenId`), so a later push —
  // the rest notification's `?slot=` — lands on this instance with new params
  // instead of mounting a copy. Follow it to that exercise's page.
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
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  // The share sheet holds the summary's ring while it is up.
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState<'finishing' | 'discarding' | null>(null);

  const day = workoutDayId ? getWorkoutDay(workoutDayId) : null;
  const routine = day ? getRoutine(day.routineId) : null;
  const { data: sets } = useLiveQuery(setLogsQuery(typeof id === 'string' ? id : ''), [id]);

  // Prefill source per snapshot slot, keyed by the exercise ON the slot and
  // re-read when a slot swaps exercise, so a variant never inherits another
  // variant's loads: the previous session of that exercise feeds both the
  // card's "Last training" line and set-by-set seeding.
  const prefillKey = prefillSourceKey(log?.plannedSnapshot ?? []);
  const previousBySlot = useMemo(() => {
    if (!log?.plannedSnapshot) return new Map<string, PreviousSession | null>();
    return new Map(log.plannedSnapshot.map((p) => [p.slotId, previousSessionSets(p.exerciseId)]));
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
      index: upcoming.setNumber - 1,
      planReps: row?.reps,
      previous: previousBySlot.get(slot.slotId)?.sets ?? [],
      logged,
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
    // The exercise's plan is done: page to the next one with sets left, or —
    // with nothing left anywhere — ask to finish, so the last check is the end.
    const slot = planned.find((p) => p.slotId === slotId);
    const plannedCount = slot ? slot.setGroups.reduce((n, g) => n + g.sets, 0) : 0;
    if (slot && doneCount >= plannedCount) {
      if (upcoming.kind === 'done') finish();
      else if (upcoming.slotId !== slotId) {
        const next = planned.findIndex((p) => p.slotId === upcoming.slotId);
        if (next >= 0) setCardIndex(next);
      }
    }
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

  // Finish work is synchronous; show the overlay first so the tap gets visible feedback.
  const closeSummary = () => {
    if (busy) return;
    setBusy('finishing');
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
        // Same wait as finishing: the teardown is synchronous and the tab must mount settled.
        setBusy('discarding');
        setTimeout(() => {
          closeSession('abandon', log.id, log.userId);
          router.replace({ pathname: '/training', params: { settling: '1' } });
        }, OVERLAY_PAINT_MS);
      },
    });

  const openReorder = () => {
    setOrderDraft(planned);
    setReordering(true);
  };

  // The unit toggle lives in the pinned session strip (never in the top bar,
  // never scrolling away), and the choice is a per-user preference: Settings
  // edits the same key, so persist every toggle.
  const changeUnit = (next: Units) => {
    setUnits(next);
    pushProfile(user);
  };

  // One exercise per page: the chip strip is the navigation (it follows the
  // current page), Prev/Next step through, and the page holds nothing but the
  // exercise at hand. The scrolling list of every card is gone — paging won in
  // the gym, and two layouts meant two sets of scroll logic to keep right.
  const idx = Math.min(cardIndex, Math.max(0, planned.length - 1));
  const current = planned[idx] ?? null;
  const goTo = (index: number) => {
    if (planned[index]) setCardIndex(index);
  };

  // Paging arrows flank the chip strip: one line carries the whole navigation.
  const NAV_BTN = 'h-8 w-8 shrink-0 items-center justify-center rounded-field bg-ink-800';
  const exerciseChips =
    planned.length > 1 ? (
      <View className="mb-3 flex-row items-center gap-2">
        <Pressable
          onPress={() => goTo(idx - 1)}
          disabled={idx === 0}
          accessibilityRole="button"
          accessibilityLabel={t('training.prev')}
          className={[NAV_BTN, idx === 0 ? 'opacity-40' : ''].join(' ')}
        >
          <ChevronLeftIcon color={muted} size={16} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <ChipRow
            items={planned.map((p, i) => ({
              value: String(i),
              label: `${i + 1}. ${p.name}`,
              done: doneSlot(p),
            }))}
            value={String(idx)}
            onChange={(v) => goTo(Number(v))}
            followSelection
          />
        </View>
        <Pressable
          onPress={() => goTo(idx + 1)}
          disabled={idx >= planned.length - 1}
          accessibilityRole="button"
          accessibilityLabel={t('training.next')}
          className={[NAV_BTN, idx >= planned.length - 1 ? 'opacity-40' : ''].join(' ')}
        >
          <ChevronRightIcon color={muted} size={16} />
        </Pressable>
      </View>
    ) : null;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <TopBar
          showBack
          showAvatar={false}
          title={day ? dayDisplayName(day, t) : t('training.workout')}
          subtitle={[
            t('training.weekN', { n: log.weekNumber }),
            isRmTestWeek(routine, log.weekNumber) ? t('training.rmTest') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          right={
            // Finish sits in the corner, where a confirming check is looked for;
            // abandon steps inward. Both still confirm before acting.
            <View className="flex-row items-center gap-2">
              <IconButton
                icon={<XIcon color={danger} size={18} />}
                onPress={cancel}
                accessibilityLabel={t('training.cancelWorkout')}
              />
              <IconButton
                icon={<CheckIcon color={brandContrast} size={18} />}
                onPress={finish}
                accessibilityLabel={t('training.finish')}
                tone="brand"
              />
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
        {/* Unit toggle (small, pinned here, never in the top bar) · position · reorder. */}
        <View className="mt-2.5 flex-row items-center gap-3">
          <View className="w-20">
            <SegmentedControl
              segments={UNIT_SEGMENTS}
              value={unit}
              onChange={changeUnit}
              size="sm"
            />
          </View>
          <Text
            numberOfLines={1}
            className="flex-1 text-center font-mono-medium text-xs uppercase tracking-wider text-ink-400"
          >
            {planned.length ? t('training.exerciseOf', { n: idx + 1, total: planned.length }) : ''}
          </Text>
          <IconButton
            icon={<DragHandleIcon color={muted} size={18} />}
            onPress={openReorder}
            accessibilityLabel={t('training.reorder')}
          />
        </View>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerClassName="grow px-5 pb-2"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exerciseChips}

        {/* Asked once, first: did the warm-up happen? A check records it on the
         * session; no per-exercise warm-up sets to log any more. */}
        {log.warmupDone == null ? (
          <Card className="mb-3 border-brand/25 bg-brand/5">
            <Text className="text-sm font-sans-semibold text-ink-50">
              {t('warmup.sessionTitle')}
            </Text>
            <Text className="mt-0.5 text-xs leading-4 text-ink-400">{t('warmup.ask')}</Text>
            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  variant="brand"
                  label={t('warmup.markDone')}
                  leftIcon={<CheckIcon color={brandContrast} size={16} />}
                  onPress={() => setWarmupDone(log.id, true)}
                />
              </View>
              <View className="flex-1">
                <Button
                  variant="secondary"
                  label={t('warmup.markSkipped')}
                  leftIcon={<XIcon color={muted} size={16} />}
                  onPress={() => setWarmupDone(log.id, false)}
                />
              </View>
            </View>
            <View className="mt-2">
              <TextLink
                label={t('warmup.sessionOpen')}
                onPress={() => router.push('/training/warmups')}
              />
            </View>
          </Card>
        ) : (
          <View className="mb-3 flex-row items-center justify-between px-1">
            <Text className="text-xs text-ink-400">
              {t(log.warmupDone ? 'warmup.done' : 'warmup.skipped')}
            </Text>
            <TextLink
              size="sm"
              label={t('warmup.change')}
              onPress={() => setWarmupDone(log.id, null)}
            />
          </View>
        )}

        {planned.length === 0 ? (
          <Text className="mt-10 text-center text-sm text-ink-400">{t('training.empty')}</Text>
        ) : current ? (
          <>
            <ExerciseCard
              key={current.slotId}
              workoutLogId={log.id}
              planned={current}
              sets={setsFor(current.exerciseId)}
              unit={unit}
              previous={previousBySlot.get(current.slotId) ?? null}
              suggestedKg={suggestedBySlot.get(current.slotId) ?? null}
              facts={factsById.get(current.exerciseId) ?? null}
              loadSetting={settingById.get(current.exerciseId) ?? null}
              userId={user.id}
              requestEffort={requestEffort}
              onLogged={onLogged}
            />
          </>
        ) : null}
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
      <TimedModal
        visible={summary !== null}
        onDone={closeSummary}
        paused={sharing}
        actions={
          summary?.exercises.length ? (
            <Button
              variant="secondary"
              label={t('share.session')}
              leftIcon={<ShareIcon color={muted} size={16} />}
              onPress={() => setSharing(true)}
            />
          ) : null
        }
      >
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
      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        model={
          summary
            ? sessionShareModel({
                summary,
                splitName: day ? dayDisplayName(day, t) : t('training.workout'),
                programLine: t('training.weekN', { n: log.weekNumber }),
                unit,
                t,
              })
            : null
        }
      />
      <BlockingOverlay
        visible={busy !== null}
        label={t(busy === 'discarding' ? 'training.abandoning' : 'training.finishing')}
      />
    </Screen>
  );
};

export default WorkoutSession;
