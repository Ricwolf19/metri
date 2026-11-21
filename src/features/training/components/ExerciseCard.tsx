import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';

import { EditIcon, PlusIcon, SkipIcon, SwapIcon } from '@/components/icons';
import {
  BadgeRow,
  Card,
  OnSurface,
  OptionSheet,
  type SelectItem,
  TextLink,
  useDialog,
  useToast,
} from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type {
  EffortMode,
  Equipment,
  Exercise,
  ExerciseSetting,
  PlannedSlot,
  SetLog,
  SwapReason,
} from '@/db/schema';
import { lbToKg } from '@/features/bmr/calc';
import { useI18n, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { formatNumber, parseDecimal, parseInteger, roundHalf, snapTo } from '@/lib/numbers';
import { settings, type Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { dumbbellRack } from '../dumbbell-rack';
import { effortRequired } from '../effort-mode';
import { upsertExerciseSetting } from '../exercise-settings.repo';
import { visualIdFor } from '../exercise-visuals';
import { exercisesQuery, getExercise } from '../exercises.repo';
import { exerciseDisplayName, targetLine } from '../labels';
import { stepAlong } from '../ladder';
import {
  clampInput,
  defaultHands,
  deriveLoad,
  hasLoadDetail,
  holdsOneDumbbell,
  kgToUnit,
  machineLoadForTotal,
  machineLoadKind,
  PLATE_MACHINE_SEED,
  POST_MACHINE_SEED,
  rackWeights,
  reconcileLoad,
  rowInputMode,
  STACK_MACHINE_SEED,
  stackPins,
  unitToKg,
  type LoadDetail,
  type MachineKind,
} from '../load';
import { exerciseHeads, muscleHeadKey } from '../muscles';
import { sideFieldFromTotal, sideStep, totalFromSide } from '../plate-math';
import { badgeDetail, badgeLabel } from '../programs/badge-copy';
import { oneDumbbellFill, seedRow } from '../row-seed';
import { bumpAnnouncement, setLoggedAnnouncement } from '../session-a11y';
import { sessionBadges } from '../session-badges';
import {
  applySwap,
  deleteSet,
  logSet,
  skipSnapshotExercise,
  skipSnapshotSet,
  updateSet,
  type PreviousSession,
  type SwapScope,
} from '../session.repo';
import { bumpValue, nextSetPrefill, weightText } from '../set-prefill';
import { expandRows, setRows } from '../set-rows';
import { similarExercises, swapOptions } from '../variants';
import {
  clearDraft,
  clearDraftLoads,
  editDraftKey,
  liveAfterDelete,
  liveDraftKey,
  readSessionDrafts,
  settleDeletedSet,
  useSessionDrafts,
  useSlotCounts,
  writeDraft,
  writeSlotCounts,
  type DraftKey,
  type Effort,
  type RowDraft,
} from '../workout-drafts';
import { ActiveSetRow } from './ActiveSetRow';
import { EffortChip } from './EffortChip';
import { ExerciseDocButton } from './ExerciseDocButton';
import { ExerciseFrames } from './ExerciseFrames';
import { LastTraining } from './LastTraining';
import { LoadPreviewSheet, type PreviewSet } from './LoadPreviewSheet';
import { MachineLoadChooser } from './MachineLoadChooser';
import { SessionNotes } from './SessionNotes';
import { LoggedRow, PendingRow, SkippedRow } from './SetRows';
import { StepGroup } from './StepGroup';
import { SwapScopeSheet } from './SwapScopeSheet';
import { SwapSheet, type SwapOption } from './SwapSheet';
import { WeightCalculatorSheet } from './WeightCalculatorSheet';

/** How long the "change it on the exercise page" hint stays after a load kind is chosen. */
const LOAD_HINT_MS = 12_000;

/** The ± jumps on offer: plate-sized for the weight, small for the reps. */
const WEIGHT_STEPS = [0.5, 1, 1.25, 2.5, 5, 10];
const REPS_STEPS = [1, 2, 3, 4, 5];

/** A glyph button in the card header (note, swap, skip): a real 40 dp box, no slop. */
const HEADER_BTN = 'h-10 w-10 items-center justify-center rounded-full active:bg-ink-700';

/** What the lifter reports after a set; `rir: null` = deliberately skipped. */
export type RequestEffort = () => Promise<Effort | null>;

type CardProps = {
  workoutLogId: string;
  planned: PlannedSlot;
  sets: SetLog[];
  unit: Units;
  /** The previous completed session of this exercise (prefill + "Last training"). */
  previous: PreviousSession | null;
  /** Progression suggestion (kg) for the first set, when history supports one. */
  suggestedKg: number | null;
  /**
   * The live row opens on the prefill chain (`nextSetPrefill`); off, it opens
   * empty and "Last training" is the only reference (`useSetPrefill`).
   */
  prefill: boolean;
  /**
   * How the session asks for effort (`effortModeFor`, the enrollment's pick or
   * the program's default): which sets may not log without one, and how every
   * effort on the card reads.
   */
  effortMode: EffortMode;
  /** How the exercise is loaded and whether each side is logged on its own. */
  facts: { equipment: Equipment | null; unilateral: boolean } | null;
  /** The owner's defaults for the exercise on the card (its last load config). */
  loadSetting: ExerciseSetting | null;
  userId: string;
  /** The lifter keeps a note on this exercise (the header pencil drops its "+"). */
  hasNote: boolean;
  /** Every exercise in the session: never offered again as a swap. */
  sessionExerciseIds: ReadonlySet<string>;
  /**
   * Runs `proceed` once the session allows this exercise's set: an exercise
   * left half done is settled first, and a first set ahead of exercises not
   * yet begun asks to move it up.
   */
  guardOrder: (proceed: () => void) => void;
  requestEffort: RequestEffort;
  /** A set or the whole exercise was just marked missed: page on like a logged set would. */
  onSkipped: (patched: PlannedSlot) => void;
  onLogged: (info: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
    /** The row just written: the live query has not caught up yet. */
    logged: SetLog;
    /** Keep the page: an extra set, or an exercise added today, may have more coming. */
    stay: boolean;
  }) => void;
};

/**
 * One exercise's page in the live session: its sets (logged, skipped, the live
 * row and a correction), the ± control bar, swap and skip, and the load sheets.
 * The workout screen mounts one at a time, keyed by slot.
 */
export const ExerciseCard = ({
  workoutLogId,
  planned,
  sets,
  unit,
  previous,
  suggestedKg: suggested,
  prefill,
  effortMode,
  facts,
  loadSetting,
  userId,
  hasNote,
  sessionExerciseIds,
  guardOrder,
  requestEffort,
  onSkipped,
  onLogged,
}: CardProps) => {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialog();
  const { brand, muted, info } = useTheme();
  // The swap sheet's lists, read when it opens (never per render: the card
  // re-renders on every keystroke in the live row). Kept after closing, so
  // the sheet stays mounted and plays its fall.
  const [swap, setSwap] = useState<{
    current: SwapOption;
    variants: SwapOption[];
    others: SwapOption[];
  } | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  // A variant picked but not yet scoped: the scope sheet asks why and for how long.
  const [pendingVariant, setPendingVariant] = useState<string | null>(null);
  const [weightStep, setWeightStep] = useState(() => settings.getWeightStep());
  const [repsStep, setRepsStep] = useState(() => settings.getRepsStep());
  // Drafts live in a module store keyed by workoutLogId: paging to another
  // exercise (or leaving training mode) unmounts this card, and the typed
  // values must survive that.
  const drafts = useSessionDrafts(workoutLogId);
  const { extra: extraRows } = useSlotCounts(workoutLogId, planned.slotId);
  const [calcOpen, setCalcOpen] = useState(false);
  // The kind the sheet must open in when a stack was just chosen: the saved
  // setting and the row's draft still describe the plates for a tick.
  const [calcSeed, setCalcSeed] = useState<LoadDetail | null>(null);
  // The machine's loading, re-asked from the row's tag (plates per side, one post, stack).
  const [kindOpen, setKindOpen] = useState(false);
  // A logged set reopened for a correction; its draft lives under `editDraftKey`.
  const [editingId, setEditingId] = useState<string | null>(null);
  // The lifter's note, opened from the header pencil.
  const [noteOpen, setNoteOpen] = useState(false);
  // A logged weight on view as its plates / pin / dumbbells (read-only).
  const [preview, setPreview] = useState<PreviewSet | null>(null);
  // Shown once a machine's load kind is chosen: where to change it later.
  const [loadHint, setLoadHint] = useState(false);
  useEffect(() => {
    if (!loadHint) return;
    const id = setTimeout(() => setLoadHint(false), LOAD_HINT_MS);
    return () => clearTimeout(id);
  }, [loadHint]);

  const rows = useMemo(() => expandRows(planned.setGroups, t), [planned.setGroups, t]);
  const working = sets.filter((s) => !s.isWarmup);
  const doneCount = working.length;
  // Skipped rows are settled like logged ones: they hold their ordinal, and
  // the live row is the first ordinal neither skipped nor logged (`setRows`).
  const skippedSet = new Set(planned.skippedSets ?? []);
  const resolvedCount = doneCount + skippedSet.size;
  const planDone = resolvedCount >= rows.length;
  /**
   * A planned row says whether it measures effort; a set beyond the plan always
   * does — unless the program logs effort freely (`effortRequired`).
   */
  const wantsEffortAt = (i: number) => effortRequired(effortMode, rows[i]?.wantsEffort ?? true);
  // Snapshots from before the badges key existed carry `undefined` — normalize
  // instead of letting the row read `.length` off nothing.
  const badges = sessionBadges(planned.badges);

  const previousSets = previous?.sets ?? [];
  // What the weight field holds: per side on a plate-loaded exercise (bar, or a
  // machine the lifter marked as plates), one dumbbell, else the total. The
  // draft's `weight` is always the total; `side` is presentation on top of it.
  const inputMode = rowInputMode(facts, loadSetting?.load, unit);
  // One dumbbell in each hand unless the exercise works a side at a time or
  // holds a single dumbbell in both hands (the seated French press).
  const oneHand = !!facts?.unilateral || holdsOneDumbbell(planned.exerciseId);
  const perSide = inputMode.mode === 'perSide' ? inputMode : null;
  // A pin stack the lifter has described (base + increment): every total is a pin.
  const stack =
    inputMode.mode === 'total' &&
    loadSetting?.load?.kind === 'machine' &&
    loadSetting.load.incrementKg > 0
      ? loadSetting.load
      : null;
  // A stack not described yet still picks: the field opens the sheet, which
  // asks for the base and the plate first (a cable, or a machine marked stack).
  const stackLoaded =
    inputMode.mode === 'total' &&
    (facts?.equipment === 'cable' ||
      (facts?.equipment === 'machine' && machineLoadKind(loadSetting?.load) === 'stack'));
  // Dumbbells come off the gym's rack (a kettlebell's sizes are no rack's: typed).
  const rackPicked = inputMode.mode === 'perHand' && facts?.equipment === 'dumbbell';
  // Plates, pins and dumbbells are picked in the load sheet, never typed: the
  // number is always one the gym holds, and the prefill arrives as plates, a pin
  // or a dumbbell.
  const picker = !!perSide || !!stack || stackLoaded || rackPicked;
  const baseInUnit = perSide ? kgToUnit(perSide.baseKg, unit) : 0;
  const sideOf = (draft: RowDraft): string =>
    draft.side ?? (perSide ? sideFieldFromTotal(draft.weight, baseInUnit, perSide.sides) : '');
  /** The detail the row's number describes, in the current input mode. */
  const deriveFor = (draft: RowDraft): LoadDetail | null =>
    deriveLoad({
      mode: inputMode,
      value: parseDecimal(perSide ? sideOf(draft) : draft.weight),
      unit,
      setting: loadSetting?.load,
      current: draft.load,
      unilateral: oneHand,
    });
  // A machine the lifter has not yet described: plates or a pin stack decides
  // what the row asks for, so the card asks first.
  const needsMachineKind =
    facts?.equipment === 'machine' && machineLoadKind(loadSetting?.load) === null;
  // Which planned row a logged set sits on (skipped ordinals shift the rest
  // down), and the live row: the first ordinal neither skipped nor logged. Its
  // ordinal moves (a deleted set, a restored skip) but its draft key does not,
  // so what was typed stays.
  const { model, live: liveIndex } = setRows({
    planned: rows.length,
    skipped: skippedSet,
    working,
    extra: extraRows,
  });
  const liveKey: DraftKey | null = liveIndex != null ? liveDraftKey(planned.slotId) : null;
  const editing = editingId ? (working.find((s) => s.id === editingId) ?? null) : null;
  const editKey: DraftKey | null = editing ? editDraftKey(planned.slotId, editing.id) : null;
  const editIndex = editing ? model.findIndex((r) => r.logged?.id === editing.id) : -1;
  /** The row the control bar and the sheet drive: the correction in progress, else the live row. */
  const focusKey = editKey ?? liveKey;

  const seedLive = (): RowDraft => {
    // Prefill off (automatic on a beginner's Foundations, or the lifter's
    // choice): every set is filled by hand — no number, no picture to confirm.
    if (!prefill) return { weight: '', reps: '', effort: null, load: null };
    // Only the live row seeds (a correction starts from its own set).
    const i = liveIndex ?? 0;
    // Set 1 opens on last session's set 1; every later set on the set just
    // logged here (`nextSetPrefill`) — and the plates, pin or dumbbells come
    // with the number (`seedRow`).
    const fill = nextSetPrefill({
      index: i,
      planReps: rows[i]?.reps,
      prevPlanReps: i > 0 ? rows[i - 1]?.reps : undefined,
      previous: previousSets,
      logged: working,
      suggestedKg: suggested,
    });
    return seedRow({
      fill: holdsOneDumbbell(planned.exerciseId) ? oneDumbbellFill(fill) : fill,
      mode: inputMode,
      unit,
      setting: loadSetting?.load,
      unilateral: oneHand,
    });
  };
  /** A correction starts from what was logged — never from history. */
  const editSeed = (logged: SetLog): RowDraft => ({
    weight: weightText(logged.weightKg, unit),
    reps: String(logged.reps),
    effort:
      logged.rir != null || logged.isFailure
        ? { rir: logged.rir, failure: logged.isFailure }
        : null,
    load: logged.load ?? null,
  });
  const seedFor = (key: DraftKey): RowDraft =>
    key === editKey && editing ? editSeed(editing) : seedLive();
  const draftFor = (key: DraftKey): RowDraft => drafts.get(key) ?? seedFor(key);
  // The store, not the render snapshot: two writes in one handler (snap, then
  // log) must each see the other.
  const freshDraft = (key: DraftKey): RowDraft =>
    readSessionDrafts(workoutLogId).get(key) ?? seedFor(key);
  // Every change to the number re-derives how it is built (`deriveLoad`), so a
  // ± tap keeps the plates; the sheet is the one caller that hands its own `load`.
  const patchDraft = (key: DraftKey, patch: Partial<RowDraft>) => {
    const next = { ...freshDraft(key), ...patch };
    // A typed total or per-hand number stops at the cap (per-side is capped in `setSide`).
    if ('weight' in patch && !('side' in patch) && !perSide) {
      const typed = parseDecimal(next.weight);
      if (typed != null) {
        const capped = clampInput(inputMode.mode, typed, unit);
        if (capped !== typed) next.weight = formatNumber(capped);
      }
    }
    const renumbered = ('weight' in patch || 'side' in patch) && !('load' in patch);
    writeDraft(workoutLogId, key, renumbered ? { ...next, load: deriveFor(next) } : next);
  };
  /** Per-side typing: the total follows. */
  const setSide = (key: DraftKey, text: string) => {
    const typed = parseDecimal(text);
    const side = typed == null ? null : clampInput('perSide', typed, unit);
    patchDraft(key, {
      side: side == null || side === typed ? text : formatNumber(side),
      weight:
        side == null ? '' : formatNumber(totalFromSide(side, baseInUnit, perSide?.sides ?? 2)),
    });
  };
  /**
   * The typed number onto what exists: a side to the smallest plate, one
   * dumbbell to the half; the total of a stack or a plain number is left as
   * typed. Silent — this IS the rounding the lifter expects, not a correction.
   */
  const snapDraft = (key: DraftKey) => {
    const draft = freshDraft(key);
    if (perSide) {
      const side = parseDecimal(sideOf(draft));
      if (side == null) return;
      const snapped = snapTo(side, sideStep(unit));
      if (snapped !== side) setSide(key, formatNumber(snapped));
      return;
    }
    // A typed dumbbell snaps to the half; one picked off the rack is already real.
    if (inputMode.mode === 'perHand' && !rackPicked) {
      const w = parseDecimal(draft.weight);
      if (w == null) return;
      const snapped = roundHalf(w);
      if (snapped !== w) patchDraft(key, { weight: formatNumber(snapped) });
    }
  };

  const setExtraRows = (n: number) =>
    writeSlotCounts(workoutLogId, planned.slotId, { extra: Math.max(0, n) });

  const stepDraft = (key: DraftKey, field: 'weight' | 'reps', delta: number) => {
    const draft = freshDraft(key);
    // A stack moves pin by pin (past a plate change too): at least one pin, the
    // one nearest the step asked for, so ± never lands between two holes.
    if (field === 'weight' && stack) {
      const pins = stackPins(stack, unit);
      const next = stepAlong(pins, parseDecimal(draft.weight) ?? pins[0] ?? 0, delta);
      const pin = pins.indexOf(next);
      patchDraft(key, {
        weight: formatNumber(next),
        // The pin itself: a round trip through the rounded number missed it in the other unit.
        load: pin < 0 ? machineLoadForTotal(unitToKg(next, unit), stack) : { ...stack, steps: pin },
      });
      return;
    }
    // A dumbbell moves to the next one on the rack the same way.
    if (field === 'weight' && rackPicked) {
      const weights = rackWeights(dumbbellRack(unit), unit);
      const current = parseDecimal(draft.weight);
      // Nothing yet: + starts on the lightest dumbbell, − stays empty.
      const next =
        current == null ? (delta > 0 ? weights[0] : undefined) : stepAlong(weights, current, delta);
      // The detail (its hands) follows the number in `patchDraft`.
      if (next != null) patchDraft(key, { weight: formatNumber(next) });
      return;
    }
    // On a plate-loaded row the ± steps the SIDE: that is the number in hand,
    // and the total plus its plates follow from it.
    if (field === 'weight' && perSide) {
      setSide(key, bumpValue(parseDecimal(sideOf(draft)) ?? 0, delta));
      return;
    }
    const current = parseDecimal(draft[field]) ?? 0;
    // Weight keeps every typed decimal (no silent plate rounding); reps stay ≥ 1.
    const next =
      field === 'weight' ? bumpValue(current, delta) : String(Math.max(1, current + delta));
    patchDraft(key, { [field]: next } as Partial<RowDraft>);
  };
  const bump = (field: 'weight' | 'reps', delta: number) => {
    if (!focusKey) return;
    haptic('tap');
    stepDraft(focusKey, field, delta);
    // Focus stays on the ± button, so the number it changed is spoken.
    AccessibilityInfo.announceForAccessibility(
      bumpAnnouncement(field, freshDraft(focusKey)[field], unit, t),
    );
  };

  /**
   * The typed row as numbers, or null after the toast that names what is
   * missing — except a missing RIR, which reads as 'effort': the check asks for
   * it (`readWithEffort`) instead of refusing.
   */
  const readDraft = (key: DraftKey, wantsEffort: boolean) => {
    // The check is tapped without leaving the field, so the blur snap runs here too.
    snapDraft(key);
    const draft = freshDraft(key);
    const w = parseDecimal(draft.weight);
    // Reps are whole: a "8.5" is a typo, not half a rep.
    const r = parseInteger(draft.reps);
    if (w == null) {
      toast.error(t('training.needWeight'));
      return null;
    }
    if (r == null || r <= 0) {
      toast.error(t('training.needReps'));
      return null;
    }
    // A prescription that measures effort is not logged without it (free mode
    // never asks): the effort chip in the action bar picks it ahead, else the
    // check opens the picker.
    const effort = draft.effort;
    if (wantsEffort && !effort) return 'effort' as const;
    const weightKg = unit === 'lb' ? lbToKg(w) : w;
    return {
      weightKg,
      reps: r,
      load: reconcileLoad({
        draft: draft.load,
        setting: loadSetting?.load,
        weightKg,
        unilateral: oneHand,
      }),
      rir: effort?.rir ?? null,
      isFailure: effort?.failure ?? false,
    };
  };

  /** `readDraft`, but a missing RIR opens the effort sheet and the pick completes the set. */
  const readWithEffort = async (key: DraftKey, wantsEffort: boolean) => {
    const read = readDraft(key, wantsEffort);
    if (read !== 'effort') return read;
    const picked = await requestEffort();
    if (!picked) return null;
    patchDraft(key, { effort: picked });
    const again = readDraft(key, wantsEffort);
    return again === 'effort' ? null : again;
  };

  const confirm = async () => {
    if (!liveKey || liveIndex == null) return;
    const key = liveKey;
    const index = liveIndex;
    const extra = index >= rows.length;
    // Checked before the order question: an incomplete row never asks to move.
    const read = await readWithEffort(key, wantsEffortAt(index));
    if (!read) return;
    guardOrder(() => {
      const logged = logSet({ workoutLogId, exerciseId: planned.exerciseId, ...read });
      haptic('confirm');
      clearDraft(workoutLogId, key);
      // The row turns into a logged one and the rest starts: say so, or a
      // screen reader user hears nothing at all.
      AccessibilityInfo.announceForAccessibility(
        setLoggedAnnouncement(
          {
            n: index + 1,
            weight: weightText(read.weightKg, unit),
            unit,
            reps: read.reps,
            twoDumbbells: read.load?.kind === 'dumbbell' && read.load.hands === 2,
          },
          t,
        ),
      );
      // The extra row is spent, or another would open by itself.
      if (extra) setExtraRows(extraRows - 1);
      onLogged({
        restSeconds: planned.restSeconds ?? 120,
        slotId: planned.slotId,
        doneCount: doneCount + 1,
        logged,
        stay: extra || !!planned.added,
      });
    });
  };

  /** Rewrite the set being corrected; no rest and no advance — nothing new happened. */
  const confirmEdit = async () => {
    if (!editing || !editKey) return;
    const read = await readWithEffort(editKey, wantsEffortAt(editIndex));
    if (!read) return;
    updateSet(editing.id, read);
    haptic('confirm');
    clearDraft(workoutLogId, editKey);
    setEditingId(null);
  };
  const cancelEdit = () => {
    if (editKey) clearDraft(workoutLogId, editKey);
    setEditingId(null);
  };
  const startEdit = (id: string) => {
    if (editKey) clearDraft(workoutLogId, editKey);
    setEditingId(id);
  };
  /**
   * The correction's delete (a hold). Deleting the exercise's last set steps
   * the live row back onto its place with what the correction held — the
   * lifter's numbers, not the prefill (`liveAfterDelete`); an earlier set
   * leaves the live row as it is.
   */
  const deleteEditing = () => {
    if (!editing || !editKey) return;
    const carried = liveAfterDelete({
      workingIds: working.map((s) => s.id),
      deletedId: editing.id,
      edit: freshDraft(editKey),
      plannedRows: rows.length,
      skipped: skippedSet,
      extraRows,
    });
    deleteSet(editing.id);
    settleDeletedSet(
      workoutLogId,
      editKey,
      carried ? { key: liveDraftKey(planned.slotId), draft: carried } : null,
    );
    setEditingId(null);
  };

  const pickEffort = async () => {
    if (!focusKey) return;
    const picked = await requestEffort();
    if (picked)
      patchDraft(focusKey, { effort: picked.rir == null && !picked.failure ? null : picked });
  };

  // The swap sheet lists the exercise on the card, then its variants (the
  // plan's movement on other kit), then — set apart — other movements for the
  // same muscles. Picking one asks for the scope before the snapshot changes.
  const optionFor = (e: Exercise): SwapOption => ({
    id: e.id,
    label: exerciseDisplayName(e, locale),
    hint: exerciseHeads(e)
      .slice(0, 3)
      .map((h) => t(muscleHeadKey(h)))
      .join(' · '),
  });
  const openSwap = () => {
    const onCard = getExercise(planned.exerciseId);
    if (!onCard) return;
    // Swapping back to the planned exercise is always offered; another one
    // already in the session is not, or the swap would repeat it.
    const variants = swapOptions(planned)
      .filter((id) => id === planned.originalExerciseId || !sessionExerciseIds.has(id))
      .flatMap((id) => {
        const e = getExercise(id);
        return e ? [optionFor(e)] : [];
      });
    const taken = new Set([...sessionExerciseIds, ...variants.map((o) => o.id)]);
    setSwap({
      current: optionFor(onCard),
      variants,
      others: similarExercises(onCard, exercisesQuery(userId).all(), taken).map(optionFor),
    });
    setSwapOpen(true);
  };
  const pendingExercise = pendingVariant ? getExercise(pendingVariant) : null;
  const pickVariant = (id: string) => {
    if (id === planned.exerciseId || !getExercise(id)) return;
    setPendingVariant(id);
  };
  const confirmSwap = ({ reason, scope }: { reason: SwapReason; scope: SwapScope }) => {
    const e = pendingVariant ? getExercise(pendingVariant) : null;
    setPendingVariant(null);
    if (!e) return;
    applySwap({
      logId: workoutLogId,
      slotId: planned.slotId,
      exerciseId: e.id,
      exerciseName: exerciseDisplayName(e, locale),
      reason,
      scope,
    });
    clearDraftLoads(workoutLogId, planned.slotId);
  };
  // Skips are confirmed with a hold: they write "missed" into the session.
  const skipSet = () => {
    if (!liveKey || liveIndex == null) return;
    const key = liveKey;
    const index = liveIndex;
    dialog.confirm({
      title: t('training.skipSetTitle', { n: index + 1 }),
      message: t('training.skipSetBody'),
      confirmLabel: t('training.skipSet'),
      destructive: true,
      onConfirm: () => {
        skipSnapshotSet(workoutLogId, planned.slotId, index, true);
        clearDraft(workoutLogId, key);
        onSkipped({
          ...planned,
          skippedSets: [...(planned.skippedSets ?? []), index].sort((a, b) => a - b),
        });
      },
    });
  };
  const restoreSet = (index: number) => skipSnapshotSet(workoutLogId, planned.slotId, index, false);
  const skipExercise = () =>
    dialog.confirm({
      title: t('training.skipExerciseTitle'),
      message: t('training.skipExerciseBody'),
      confirmLabel: t('training.skipExercise'),
      destructive: true,
      onConfirm: () => {
        skipSnapshotExercise(workoutLogId, planned.slotId, true);
        onSkipped({ ...planned, skipped: { at: Date.now() } });
      },
    });
  const restoreExercise = () => skipSnapshotExercise(workoutLogId, planned.slotId, false);

  const focusDraft = focusKey ? draftFor(focusKey) : null;
  const focusWantsEffort = editing
    ? wantsEffortAt(editIndex)
    : liveIndex != null
      ? wantsEffortAt(liveIndex)
      : false;
  const detailActive = hasLoadDetail(loadSetting);
  /** What the number in the row means when it is not simply the total, and how it is built. */
  const rowCaption = (draft: RowDraft): { text: string | null; breakdown: LoadDetail | null } => {
    const value = parseDecimal(draft.weight);
    if (value == null) return { text: null, breakdown: null };
    const draftDumbbell = draft.load?.kind === 'dumbbell' ? draft.load : null;
    if (draftDumbbell || loadSetting?.load?.kind === 'dumbbell') {
      const hands = draftDumbbell?.hands ?? defaultHands(oneHand);
      // One dumbbell in both hands needs no caption: the number is the load.
      const text =
        hands === 2
          ? t('load.perHandCaption', {
              perHand: draft.weight,
              // Already in the display unit; only the float noise of ×2 is trimmed.
              total: Math.round(value * 200) / 100,
              unit,
            })
          : facts?.unilateral
            ? t('load.perSideCaption', { value: draft.weight, unit })
            : null;
      return { text, breakdown: null };
    }
    const breakdown = draft.load ?? null;
    // The picker field shows the total, so the line under it reads per side
    // (one post has no sides: its tag already says the plates go on once).
    if (perSide)
      return {
        text: perSide.sides === 2 ? t('load.perSideCaption', { value: sideOf(draft), unit }) : null,
        breakdown,
      };
    if (facts?.unilateral)
      return { text: t('load.perSideCaption', { value: draft.weight, unit }), breakdown };
    return { text: null, breakdown };
  };
  /** The per-side field for `ActiveSetRow`, on plate-loaded rows only. */
  const sideInputFor = (key: DraftKey, draft: RowDraft) =>
    perSide
      ? {
          baseLabel: formatNumber(baseInUnit, 2),
          sides: perSide.sides,
          value: sideOf(draft),
          onChange: (text: string) => setSide(key, text),
        }
      : undefined;
  const machineKind = facts?.equipment === 'machine' ? machineLoadKind(loadSetting?.load) : null;
  // A stack has no base to name, so the row's tag says what it is; any machine's tag re-opens the choice.
  const kindTag = machineKind === 'stack' ? t('training.stackTag') : undefined;
  const onChangeKind = machineKind ? () => setKindOpen(true) : undefined;
  /** What the live row and a correction share: the draft under `key`, how its load reads, the sheet. */
  const draftRowProps = (key: DraftKey) => {
    const draft = draftFor(key);
    const cap = rowCaption(draft);
    return {
      draft,
      unit,
      onChange: (patch: Partial<RowDraft>) => patchDraft(key, patch),
      onOpenCalculator: () => setCalcOpen(true),
      detailActive,
      caption: cap.text,
      breakdown: cap.breakdown,
      side: sideInputFor(key, draft),
      onBlurWeight: () => snapDraft(key),
      kindTag,
      onChangeKind,
      picker,
    };
  };
  // Plates write their seed at once; a stack needs base + pins, so it opens the sheet.
  // Re-choosing from the row's tag resets the saved picture the same way the
  // exercise page does: the next number is built on the new kind.
  const chooseMachineKind = (kind: MachineKind) => {
    if (kind === machineKind) return;
    if (focusKey) clearDraftLoads(workoutLogId, planned.slotId);
    if (kind === 'stack') {
      // Saved at once, like plates: the choice sticks even if the sheet is
      // closed before the plate weight is typed, and the row's field reopens it.
      upsertExerciseSetting(userId, planned.exerciseId, { load: STACK_MACHINE_SEED });
      setCalcSeed(STACK_MACHINE_SEED);
      setCalcOpen(true);
      setLoadHint(true);
      return;
    }
    upsertExerciseSetting(userId, planned.exerciseId, {
      load: kind === 'post' ? POST_MACHINE_SEED : PLATE_MACHINE_SEED,
    });
    setLoadHint(true);
  };
  const kindItems: SelectItem<MachineKind>[] = [
    { value: 'plates', label: t('load.platesPerSide') },
    { value: 'post', label: t('load.platesOnePost') },
    { value: 'stack', label: t('load.machineStack') },
  ];

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
        {/* Each glyph owns a real 40 dp box, side by side with no slop: at the
            old 36 dp pitch their slops overlapped and a tap could land on the
            neighbour. The doc button keeps its own 8 dp slop, so it sits that
            far from the skip box. */}
        <View className="flex-row items-center">
          {/* The lifter's note, one tap away: a pencil, with a "+" until there is one. */}
          <Pressable
            onPress={() => setNoteOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel={t(hasNote ? 'exNote.edit' : 'exNote.add')}
            className={HEADER_BTN}
          >
            <EditIcon color={hasNote ? info : muted} size={16} />
            {!hasNote ? (
              <View className="absolute right-1.5 top-1.5 h-3 w-3 items-center justify-center rounded-full bg-ink-700">
                <PlusIcon color={brand} size={9} strokeWidth={3} />
              </View>
            ) : null}
          </Pressable>
          {/* The swap glyph opens the variants and same-muscle options. */}
          {facts ? (
            <Pressable
              onPress={openSwap}
              accessibilityRole="button"
              accessibilityLabel={t('training.alternatives')}
              className={HEADER_BTN}
            >
              <SwapIcon color={muted} size={17} />
            </Pressable>
          ) : null}
          {!planned.skipped ? (
            <Pressable
              onPress={skipExercise}
              accessibilityRole="button"
              accessibilityLabel={t('training.skipExercise')}
              className={HEADER_BTN}
            >
              <SkipIcon color={muted} size={17} />
            </Pressable>
          ) : null}
          <View className="ml-2">
            <ExerciseDocButton exerciseId={planned.exerciseId} size={17} />
          </View>
        </View>
      </View>
      {swap ? (
        <SwapSheet
          visible={swapOpen}
          onClose={() => setSwapOpen(false)}
          current={swap.current}
          variants={swap.variants}
          others={swap.others}
          onPick={pickVariant}
        />
      ) : null}
      <OptionSheet
        visible={kindOpen}
        onClose={() => setKindOpen(false)}
        label={t('load.machineKindTitle')}
        items={kindItems}
        value={machineKind ?? undefined}
        onChange={(kind) => {
          setKindOpen(false);
          chooseMachineKind(kind);
        }}
      />
      <SwapScopeSheet
        visible={pendingVariant !== null}
        exerciseName={pendingExercise ? exerciseDisplayName(pendingExercise, locale) : ''}
        onClose={() => setPendingVariant(null)}
        onConfirm={confirmSwap}
      />

      {/* Cues and facts share ONE sideways line — a second strip, or a hint
          wrapping under it, moved the sets down on some cards and not others. */}
      {badges.length || facts?.unilateral ? (
        <View className="mt-2">
          <BadgeRow
            mono
            tone="brand"
            items={[
              ...badges.map((b, i) => {
                // A pause is technique, not a tag: it reads in full and in `info`
                // so it is not forgotten by set three.
                const detail = badgeDetail(b, locale);
                const label = badgeLabel(b, locale);
                return detail
                  ? { value: `${b}-${i}`, label: `${label} · ${detail}`, tone: 'info' as const }
                  : { value: `${b}-${i}`, label };
              }),
              ...(facts?.unilateral
                ? [
                    {
                      value: 'unilateral',
                      label: `${t('training.unilateral')} · ${t('training.unilateralHint')}`,
                      tone: 'info' as const,
                      mono: false,
                    },
                  ]
                : []),
            ]}
          />
        </View>
      ) : null}

      <SessionNotes
        slotNote={planned.notes}
        exerciseId={planned.exerciseId}
        editing={noteOpen}
        onEditingChange={setNoteOpen}
      />

      {previous?.sets.length ? (
        <LastTraining
          previous={previous}
          unit={unit}
          effortMode={effortMode}
          onSetPress={setPreview}
        />
      ) : null}

      {/* Asked once per machine, before the first number: plates and a pin stack
          are different rows (per side vs total) and different pictures. */}
      {needsMachineKind ? (
        <View className="mt-3 rounded-field border border-ink-700 bg-ink-850 px-3 py-2.5">
          {/* The box paints the card's inset fill: the chooser's strip fades into it. */}
          <OnSurface surface="sunken">
            <MachineLoadChooser value={null} onChange={chooseMachineKind} />
          </OnSurface>
        </View>
      ) : loadHint ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-x-1.5">
          <Text className="text-xs text-ink-400">{t('training.loadTypeSaved')}</Text>
          <TextLink
            label={t('training.loadTypeChange')}
            onPress={() =>
              router.push({
                pathname: '/training/exercise/[id]',
                params: { id: planned.exerciseId },
              })
            }
          />
        </View>
      ) : null}

      {planned.skipped ? (
        <View className="mt-3 flex-row items-center justify-between gap-3 rounded-field border border-red-500/30 bg-red-500/10 px-3 py-2.5">
          <Text className="flex-1 text-sm font-sans-semibold text-red-400">
            {t('training.skippedExercise')}
          </Text>
          <TextLink label={t('training.restore')} onPress={restoreExercise} />
        </View>
      ) : null}

      <View className={planned.skipped ? 'hidden' : 'mt-3 gap-1.5'}>
        {model.map(({ i, logged }) => {
          const key = `${i}`;
          const row = rows[i] ?? null;
          const legend = row ? targetLine(row, t) : null;
          if (skippedSet.has(i)) {
            return (
              <SkippedRow
                key={key}
                label={String(i + 1)}
                text={t('training.skippedSet')}
                onRestore={() => restoreSet(i)}
              />
            );
          }
          if (logged && editKey && logged.id === editingId) {
            return (
              <ActiveSetRow
                key={editKey}
                label={t('training.setEditing', { n: i + 1 })}
                legend={legend}
                {...draftRowProps(editKey)}
                onConfirm={() => void confirmEdit()}
                onRemove={cancelEdit}
                removeLabel={t('training.cancelEdit')}
                onDelete={deleteEditing}
                deleteLabel={t('training.deleteSet', { n: i + 1 })}
              />
            );
          }
          if (logged) {
            return (
              <LoggedRow
                key={logged.id}
                label={String(i + 1)}
                logged={logged}
                unit={unit}
                effortMode={effortMode}
                onEdit={() => startEdit(logged.id)}
                onWeightPress={() => setPreview(logged)}
              />
            );
          }
          if (!liveKey || i !== liveIndex) {
            return <PendingRow key={key} label={String(i + 1)} legend={legend} />;
          }
          return (
            <ActiveSetRow
              key={key}
              label={t('training.setN', { n: i + 1 })}
              legend={legend}
              {...draftRowProps(liveKey)}
              onConfirm={() => void confirm()}
              onSkip={row ? skipSet : undefined}
              onRemove={
                row
                  ? undefined
                  : () => {
                      clearDraft(workoutLogId, liveKey);
                      setExtraRows(extraRows - 1);
                    }
              }
            />
          );
        })}
      </View>

      {/* One control bar per card, always in the same place, driving the live row. */}
      {focusKey && focusDraft && !planned.skipped ? (
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
          <EffortChip
            effort={focusDraft.effort}
            wantsEffort={focusWantsEffort}
            effortMode={effortMode}
            onPress={() => void pickEffort()}
          />
        </View>
      ) : null}

      <View className="mt-2 flex-row items-center justify-center gap-4">
        {/* Extra sets only unlock once the plan is done — sets have an order. */}
        {planDone ? (
          <Pressable
            onPress={() => setExtraRows(extraRows + 1)}
            accessibilityRole="button"
            className="min-h-11 flex-row items-center gap-1 px-3"
          >
            <PlusIcon color={brand} size={14} />
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="text-xs font-sans-semibold text-brand"
            >
              {t('training.extraSet')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <LoadPreviewSheet
        set={preview}
        onClose={() => setPreview(null)}
        unit={unit}
        equipment={facts?.equipment ?? null}
        effortMode={effortMode}
      />

      {/* The load sheet applies straight into the live row's draft, and a
          changed setup is remembered on the exercise for the next session. */}
      <WeightCalculatorSheet
        visible={calcOpen}
        onClose={() => {
          setCalcOpen(false);
          setCalcSeed(null);
        }}
        unit={unit}
        initialWeight={focusDraft?.weight ?? ''}
        initialLoad={calcSeed ?? focusDraft?.load ?? loadSetting?.load ?? null}
        equipment={facts?.equipment ?? null}
        unilateral={oneHand}
        oneDumbbell={holdsOneDumbbell(planned.exerciseId)}
        preferMode={needsMachineKind ? 'machine' : undefined}
        onApply={({ row, save }) => {
          if (!focusKey) return;
          // `side` is dropped on purpose: the sheet may have changed the base,
          // and the row re-splits the total over the base it renders with.
          if (row)
            patchDraft(focusKey, { weight: row.weightText, load: row.load, side: undefined });
          if (save) {
            upsertExerciseSetting(userId, planned.exerciseId, { load: save });
            if (needsMachineKind) setLoadHint(true);
          }
        }}
      />
    </Card>
  );
};
