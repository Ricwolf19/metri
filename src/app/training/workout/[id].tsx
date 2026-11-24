import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/components/icons';
import { TopBar } from '@/components/TopBar';
import {
  BlockingOverlay,
  Button,
  Card,
  IconButton,
  KEYBOARD_CLEARANCE,
  Screen,
  SegmentedControl,
  TextLink,
  useDialog,
  useSheetOwnsKeyboard,
} from '@/components/ui';
import type { Exercise, PlannedSlot, SetLog, WorkoutLog } from '@/db/schema';
import { useLiveQuery } from '@/db/useLiveQuery';
import { useAuth } from '@/features/auth/auth-context';
import {
  endRest,
  extendRest,
  redrawSession,
  showSession,
  startRest,
} from '@/features/notifications/rest-notification';
import { ensureNotificationPermission } from '@/features/notifications/service';
import { getRoutine, reorderSplitFromNowOn } from '@/features/training/authoring.repo';
import { closeSession } from '@/features/training/close-session';
import { AddExerciseSheet } from '@/features/training/components/AddExerciseSheet';
import { EffortSheet } from '@/features/training/components/EffortSheet';
import { ExerciseCard, type RequestEffort } from '@/features/training/components/ExerciseCard';
import { RestTimer } from '@/features/training/components/RestTimer';
import {
  SessionChipStrip,
  type SessionChip,
} from '@/features/training/components/SessionChipStrip';
import { effortModeFor } from '@/features/training/effort-mode';
import { enrollmentQuery } from '@/features/training/enroll';
import { notedExercisesQuery } from '@/features/training/exercise-notes.repo';
import { exerciseSettingsQuery } from '@/features/training/exercise-settings.repo';
import { exerciseFactsQuery } from '@/features/training/exercises.repo';
import {
  dayDisplayName,
  exerciseDisplayName,
  exerciseShortName,
  targetLine,
} from '@/features/training/labels';
import { getWorkoutDay } from '@/features/training/programs.repo';
import { isRmTestWeek } from '@/features/training/progression';
import { restState, useActiveRest } from '@/features/training/rest-state';
import { nextSetSummary, type NextSet } from '@/features/training/rest-summary';
import { addSessionExercise } from '@/features/training/session-add';
import { isReopened } from '@/features/training/session-end';
import {
  chronologyMove,
  mergeOrder,
  pendingElsewhere,
  sessionNext,
  sessionOrder,
  slotState,
} from '@/features/training/session-order';
import {
  sessionState,
  type ActiveSession,
  type NextSetCopy,
} from '@/features/training/session-state';
import {
  getWorkout,
  markRemainingSkipped,
  previousSessionSets,
  reorderSnapshot,
  setLogsQuery,
  setWarmupDone,
  suggestedWeight,
  workoutQuery,
  type PreviousSession,
} from '@/features/training/session.repo';
import { nextSetPrefill, weightText } from '@/features/training/set-prefill';
import { expandRows } from '@/features/training/set-rows';
import { useSetPrefill } from '@/features/training/useSetPrefill';
import { prefillSourceKey } from '@/features/training/variants';
import { readFocusSlot, writeFocusSlot, type Effort } from '@/features/training/workout-drafts';
import { useI18n, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { playSound } from '@/lib/sounds';
import type { Units } from '@/lib/storage';
import { useBlockingTask } from '@/lib/useBlockingTask';
import { UNIT_SEGMENTS, useEquipmentUnits } from '@/lib/useUnits';
import { useTheme } from '@/theme/theme-context';

const pad2 = (n: number) => String(n).padStart(2, '0');

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

/**
 * The session's scroller. A sheet over the session owns the keyboard (the
 * weight sheet's fields, the add-exercise search): the sets behind must not
 * scroll for it, nor shift as it opens and closes. A leaf, so a keyboard
 * showing or hiding re-renders this alone, not the whole session.
 */
const SessionScroll = (props: React.ComponentProps<typeof KeyboardAwareScrollView>) => {
  const sheetOwnsKeyboard = useSheetOwnsKeyboard();
  return <KeyboardAwareScrollView {...props} enabled={!sheetOwnsKeyboard} />;
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

  const { units: unit, setUnits } = useEquipmentUnits();
  // The chip a hold picked up: arrows appear beside the strip to move it,
  // until a tap on the strip puts it down.
  const [lifted, setLifted] = useState<string | null>(null);
  // The order when the chip was lifted, so putting it down knows whether anything moved.
  const [liftOrder, setLiftOrder] = useState<string[] | null>(null);
  // The page in view, by slot: the strip's order is not the snapshot's (missed
  // exercises sit at the end) and a reorder must not move the page under the lifter.
  // A notification's `?slot=` wins; otherwise the page the lifter left open
  // (leaving training mode unmounts this screen; coming back must not reset).
  const [pageSlot, setPageSlot] = useState<string | null>(
    () => focusSlot ?? (typeof id === 'string' ? readFocusSlot(id) : null),
  );
  // The screen is singular per workout (`workoutScreenId`), so a later push —
  // the rest notification's `?slot=` — lands on this instance with new params
  // instead of mounting a copy. Follow it to that exercise's page.
  const [seenSlot, setSeenSlot] = useState(focusSlot);
  if (focusSlot !== seenSlot) {
    setSeenSlot(focusSlot);
    if (focusSlot) setPageSlot(focusSlot);
  }
  // One effort sheet serves every set row; the row awaits the resolver. If the
  // screen unmounts mid-pick (tab switch), resolve null so no await hangs.
  const [effortResolve, setEffortResolve] = useState<((e: Effort | null) => void) | null>(null);
  const effortResolveRef = useRef<((e: Effort | null) => void) | null>(null);
  useEffect(() => {
    return () => effortResolveRef.current?.(null);
  }, []);
  // The page in view, remembered for the next mount of this screen (the user
  // left training mode and came back). Above the early returns: hooks order.
  const snapshotNow = log?.plannedSnapshot ?? [];
  const focusedSlotId =
    (pageSlot && snapshotNow.some((p) => p.slotId === pageSlot) ? pageSlot : null) ??
    snapshotNow[0]?.slotId ??
    null;
  useEffect(() => {
    if (logId && focusedSlotId) writeFocusSlot(logId, focusedSlotId);
  }, [logId, focusedSlotId]);
  const activeRest = useActiveRest();
  const rest = activeRest?.workoutId === log?.id ? activeRest : null;
  // The rest bar sits under the scroll view; a focused field must clear it.
  const [restBarHeight, setRestBarHeight] = useState(0);
  // So does the finish bar, shown once every planned set is settled.
  const [finishBarHeight, setFinishBarHeight] = useState(0);
  const blocking = useBlockingTask<'finishing' | 'discarding'>();
  // One finish per session: the last check and a tap on the bar can land together.
  const finishing = useRef(false);

  const day = workoutDayId ? getWorkoutDay(workoutDayId) : null;
  const routine = day ? getRoutine(day.routineId) : null;
  // The enrollment the session belongs to: its template decides the defaults
  // below, and it holds the lifter's effort pick (`user_programs.effort_mode`).
  // Live, so a change on the program screen reaches a session already open.
  const userProgramId = log?.userProgramId ?? '';
  const { data: enrollmentRows } = useLiveQuery(enrollmentQuery(user?.id ?? '', userProgramId), [
    user?.id,
    userProgramId,
  ]);
  const enrollment = enrollmentRows[0] ?? null;
  const effortMode = effortModeFor(enrollment?.programId, enrollment?.effortMode);
  // A beginner's Foundations session opens its sets empty unless the lifter
  // switched prefill on in Settings.
  const { enabled: prefill } = useSetPrefill(enrollment?.programId);
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
  const { data: notedRows } = useLiveQuery(notedExercisesQuery(user?.id ?? '', exerciseIds), [
    user?.id,
    prefillKey,
  ]);
  const notedIds = new Set(notedRows.map((r) => r.exerciseId));
  // What the session already holds — the planned exercise of a swapped slot too —
  // so neither the add sheet nor a swap offers a second copy of it.
  const sessionExerciseIds = useMemo(
    () =>
      new Set(
        (log?.plannedSnapshot ?? []).flatMap((p) =>
          p.originalExerciseId ? [p.exerciseId, p.originalExerciseId] : [p.exerciseId],
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefillKey],
  );
  const [addOpen, setAddOpen] = useState(false);
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

  const plannedSetsOf = (p: PlannedSlot) => p.setGroups.reduce((x, g) => x + g.sets, 0);
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
    const rows = expandRows(slot.setGroups, t);
    const row = rows[upcoming.setNumber - 1];
    const logged = workingSetsFor(slot.exerciseId);
    if (justLogged?.exerciseId === slot.exerciseId && !logged.some((s) => s.id === justLogged.id))
      logged.push(justLogged);
    const fill = nextSetPrefill({
      index: upcoming.setNumber - 1,
      planReps: row?.reps,
      prevPlanReps: upcoming.setNumber > 1 ? rows[upcoming.setNumber - 2]?.reps : undefined,
      previous: previousBySlot.get(slot.slotId)?.sets ?? [],
      logged,
      suggestedKg: suggestedBySlot.get(slot.slotId) ?? null,
    });
    return {
      slotId: slot.slotId,
      exerciseName: slot.name,
      setLabel: t('session.setOf', { n: upcoming.setNumber, total: upcoming.setTotal }),
      targetLabel: row ? targetLine(row, t) : '',
      // Prefill off, the row opens empty: the card must not name a load it won't show.
      weightLabel:
        prefill && fill.weightKg != null ? `${weightText(fill.weightKg, unit)} ${unit}` : '',
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
      void showSession(
        sessionRecord(started, nextSetCopy(snapshot, sessionNext(snapshot, doneFor))),
      );
    });
    // The helpers close over the live sets and prefill maps: a stale read on
    // this one-time draw is corrected by the first logged set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWorkoutId, t]);

  // Anything else that changes the next set — a reorder, restoring a skip,
  // deleting a set, a swap, the unit — redraws the card from the session as it
  // now stands, so it never names a set that is no longer next. Logging and
  // skipping write their own face first; this then finds nothing to change.
  const nextSignature = JSON.stringify([
    log?.plannedSnapshot,
    sets.filter((s) => !s.isWarmup).map((s) => [s.id, s.weightKg, s.reps]),
    unit,
    prefill,
  ]);
  useEffect(() => {
    if (!liveWorkoutId) return;
    const record = sessionState.get();
    const workout = getWorkout(liveWorkoutId);
    if (record?.workoutId !== liveWorkoutId || !workout) return;
    const snapshot = workout.plannedSnapshot ?? [];
    const next = nextSetCopy(snapshot, sessionNext(snapshot, doneFor));
    if (JSON.stringify(next) === JSON.stringify(record.next ?? null)) return;
    void showSession(sessionRecord(workout, next));
    // The helpers read the same render's sets; the signature is what changes them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWorkoutId, nextSignature, t]);

  // The OS may kill the foreground service alone and take the card with it;
  // a re-post of the current face is idempotent and cheap.
  useEffect(() => {
    if (!liveWorkoutId) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && sessionState.get()?.workoutId === liveWorkoutId) void redrawSession();
    });
    return () => sub.remove();
  }, [liveWorkoutId]);

  // While the finish (or discard) runs behind its overlay, the log stops being
  // in progress a frame before this screen is replaced: redirecting then would
  // race the summary for the navigation.
  if (!user || !log || (log.status !== 'in_progress' && blocking.busy === null)) {
    return <Redirect href="/training" />;
  }

  const planned = log.plannedSnapshot ?? [];

  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);

  const totalPlannedSets = planned.reduce(
    (sum, p) => sum + p.setGroups.reduce((x, g) => x + g.sets, 0),
    0,
  );
  const doneSets = sets.filter((s) => !s.isWarmup).length;
  // Skipped sets fill the bar too: the session is "settled", not "trained".
  // Per exercise and never past its plan: an exercise skipped half done used to
  // count its logged sets on top of all its planned ones.
  const settledSets = planned.reduce((sum, p) => {
    const plan = plannedSetsOf(p);
    if (p.skipped) return sum + plan;
    const done = sets.filter((s) => s.exerciseId === p.exerciseId && !s.isWarmup).length;
    return sum + Math.min(plan, done + (p.skippedSets?.length ?? 0));
  }, 0);
  const progress = totalPlannedSets ? Math.min(1, settledSets / totalPlannedSets) : 0;

  const requestEffort: RequestEffort = () =>
    new Promise((resolve) => {
      const resolver = (e: Effort | null) => {
        if (e) haptic('tick');
        resolve(e);
        effortResolveRef.current = null;
        setEffortResolve(null);
      };
      effortResolveRef.current = resolver;
      setEffortResolve(() => resolver);
    });

  // A reopened session (finished once, back from its summary) can be finished
  // again but never abandoned: abandoning deletes its sets.
  const reopened = isReopened(log);
  // Every planned set logged or skipped: what the finish bar waits for.
  const settled = sessionNext(planned, doneFor).kind === 'done';

  /**
   * The session is over: the end is stamped from the last set
   * (`finishWorkout` → `sessionEndAt`), never from a confirmation the lifter
   * may forget to give, and the summary replaces this screen — nested to
   * nested, so a replace, not a second Train tab. A rest still running ends at
   * once (`endRest` is the one place the alarm stops).
   */
  const finishNow = () => {
    if (finishing.current) return;
    finishing.current = true;
    if (restState.get()?.workoutId === log.id) void endRest();
    playSound('sessionDone');
    haptic('confirm');
    // The teardown is synchronous: it runs once the overlay is on screen, and
    // the overlay stays (`keep`) until the summary replaces this screen.
    blocking.start(
      'finishing',
      () => {
        closeSession('finish', log.id, log.userId);
        router.replace({
          pathname: '/training/summary/[id]',
          params: { id: log.id, finished: '1' },
        });
      },
      { keep: true },
    );
  };

  // The header's check and the finish bar. With every planned set settled
  // there is nothing to confirm; with sets still open the two header buttons
  // sit side by side and ending by a mis-tap marks those sets missed, so it
  // asks first. A rest still running ends as the question opens: the alarm
  // must not ring over it.
  const requestFinish = () => {
    if (restState.get()?.workoutId === log.id) void endRest();
    if (settled) {
      finishNow();
      return;
    }
    dialog.confirm({
      title: t('training.finishConfirm'),
      message: t('training.finishConfirmBody'),
      confirmLabel: t('training.finish'),
      onConfirm: finishNow,
    });
  };

  /**
   * After a set is settled (logged or skipped): page to the next exercise with
   * sets left, or — with nothing left anywhere — finish, so the last check is
   * the end. Reads the snapshot it is handed: the live query lags a skip by a
   * tick.
   */
  const advanceAfter = (plannedNow: PlannedSlot[], slotId: string, doneInSlot: number) => {
    const upcoming = nextSetSummary(plannedNow, slotId, doneInSlot, doneFor);
    if (upcoming.kind === 'done') finishNow();
    else if (upcoming.slotId !== slotId) setPageSlot(upcoming.slotId);
    return upcoming;
  };

  // A skip moves on from where the session stands, not from the exercise
  // skipped: skipping one further down the list while another is half done
  // sends the lifter (and the notification) back to the half-done one.
  const onSkipped = (patched: PlannedSlot) => {
    const plannedNow = planned.map((p) => (p.slotId === patched.slotId ? patched : p));
    const upcoming = sessionNext(plannedNow, doneFor);
    // The last open set skipped ends the session like the last one logged.
    if (upcoming.kind === 'done') {
      finishNow();
      return;
    }
    if (upcoming.slotId !== patched.slotId) setPageSlot(upcoming.slotId);
    void showSession(sessionRecord(log, nextSetCopy(plannedNow, upcoming)));
  };

  // Copy is frozen here (an event, not render) so the one notification can be
  // redrawn headlessly without i18n. The session face is written first and the
  // rest layered on it, so the card never shows a stale next set mid-rest.
  const onLogged = ({
    restSeconds,
    slotId,
    doneCount,
    logged,
    stay,
  }: {
    restSeconds: number;
    slotId: string;
    doneCount: number;
    logged: SetLog;
    stay: boolean;
  }) => {
    const startedAt = Date.now();
    // Read back, not from this render: the guard may have just marked another
    // exercise missed or moved this one up, and paging must see that.
    const plannedNow = getWorkout(log.id)?.plannedSnapshot ?? planned;
    const upcoming = stay
      ? nextSetSummary(plannedNow, slotId, doneCount, doneFor)
      : advanceAfter(plannedNow, slotId, doneCount);
    // The last set finished the session (`advanceAfter`): no rest starts and
    // no face is drawn — the teardown takes the card down.
    if (!stay && upcoming.kind === 'done') return;
    const record = sessionRecord(log, nextSetCopy(plannedNow, upcoming, logged));
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

  // The teardown is synchronous and the tab must settle: `dismissTo` returns to
  // the Train tab that is already mounted (a `replace` stacked a second copy of
  // every tab), and `settling` keeps the wait up while it re-runs its queries.
  const cancel = () =>
    dialog.confirm({
      title: t('training.cancelConfirm'),
      confirmLabel: t('training.cancelWorkout'),
      destructive: true,
      onConfirm: () => {
        playSound('discard');
        blocking.start(
          'discarding',
          () => {
            closeSession('abandon', log.id, log.userId);
            router.dismissTo({ pathname: '/training', params: { settling: '1' } });
          },
          { keep: true },
        );
      },
    });

  // The unit toggle lives in the pinned session strip (never in the top bar,
  // never scrolling away). It is the EQUIPMENT unit — the gym's plates — so
  // flipping it here never changes how body weight or food read elsewhere;
  // Settings edits the same key.
  const changeUnit = (next: Units) => setUnits(next);

  // One exercise per page: the chip strip is the navigation (it follows the
  // current page, a tap opens another), and the page holds nothing but the
  // exercise at hand. Missed exercises sit at the end of the strip, so the
  // numbering walks the strip's order, not the snapshot's.
  const { active, missed } = sessionOrder(planned, doneFor);
  const ordered = [...active, ...missed];
  const idx = Math.max(
    0,
    ordered.findIndex((p) => p.slotId === focusedSlotId),
  );
  const current = ordered[idx] ?? null;
  /** A new order of the exercises in play; missed ones keep their snapshot places. */
  const writeActiveOrder = (activeIds: string[]) =>
    reorderSnapshot(
      log.id,
      mergeOrder(
        planned.map((p) => p.slotId),
        new Set(missed.map((p) => p.slotId)),
        activeIds,
      ),
    );
  // The session is recorded exercise by exercise. One left half done is
  // settled before a set goes anywhere else; then a first set ahead of
  // exercises not yet begun moves up to be next. Asked, then done.
  const guardOrder = (slotId: string) => (proceed: () => void) => {
    const checkOrder = () => {
      const moved = chronologyMove(active, slotId, doneFor);
      if (!moved) {
        proceed();
        return;
      }
      const slot = active.find((p) => p.slotId === slotId);
      dialog.confirm({
        title: t('training.orderMoveTitle'),
        message: t('training.orderMoveBody', {
          name: slot?.name ?? '',
          n: moved.indexOf(slotId) + 1,
        }),
        confirmLabel: t('training.orderMoveConfirm'),
        onConfirm: () => {
          writeActiveOrder(moved);
          proceed();
        },
      });
    };
    const pending = pendingElsewhere(planned, slotId, doneFor);
    if (!pending) {
      checkOrder();
      return;
    }
    dialog.show({
      title: t('training.pendingTitle', { name: pending.slot.name }),
      message: t('training.pendingBody', { n: pending.open }),
      actions: [
        {
          label: t('training.pendingGoBack'),
          style: 'confirm',
          onPress: () => setPageSlot(pending.slot.slotId),
        },
        {
          label: t('training.pendingMarkMissed'),
          style: 'destructive',
          onPress: () => {
            markRemainingSkipped(log.id, pending.slot.slotId);
            checkOrder();
          },
        },
        { label: t('common.cancel'), style: 'cancel' },
      ],
    });
  };
  // Reorder without a modal: hold a chip to lift it, the arrows move it one
  // place (persisted into the snapshot at once), a tap on the strip puts it down.
  const liftedIndex = lifted ? active.findIndex((p) => p.slotId === lifted) : -1;
  const moveLifted = (delta: number) => {
    const to = liftedIndex + delta;
    if (liftedIndex < 0 || !active[to]) return;
    const ids = active.map((p) => p.slotId);
    const [moving] = ids.splice(liftedIndex, 1);
    ids.splice(to, 0, moving);
    writeActiveOrder(ids);
    haptic('tick');
    // The chip moves out from under nothing a screen reader can see: say where it landed.
    AccessibilityInfo.announceForAccessibility(
      t('training.exerciseOf', { n: to + 1, total: planned.length }),
    );
  };
  const lift = (slotId: string) => {
    setLifted(slotId);
    setLiftOrder(planned.map((p) => p.slotId));
    setPageSlot(slotId);
    AccessibilityInfo.announceForAccessibility(t('training.reorderHint'));
  };
  // Putting a moved chip down asks whether the order is today's or the
  // split's from now on; the snapshot already holds it either way.
  const putDown = () => {
    setLifted(null);
    const order = planned.map((p) => p.slotId);
    const moved = liftOrder != null && liftOrder.some((id, i) => id !== order[i]);
    setLiftOrder(null);
    if (!moved) return;
    dialog.show({
      title: t('training.reorderScopeTitle'),
      message: t('training.reorderScopeBody'),
      actions: [
        {
          label: t('training.reorderCycle'),
          style: 'confirm',
          onPress: () => reorderSplitFromNowOn(log.workoutDayId, order),
        },
        { label: t('training.reorderSessionOnly'), style: 'cancel' },
      ],
    });
  };
  const onChip = (slotId: string) => {
    if (lifted) putDown();
    setPageSlot(slotId);
  };
  // An exercise from the library joins today's session — for today, or kept
  // in the split from now on. It lands last among the exercises still in play.
  const addExercise = (exercise: Exercise) => {
    const add = (keep: boolean) => {
      const entry = addSessionExercise({
        logId: log.id,
        userId: user.id,
        exerciseId: exercise.id,
        keep,
        locale,
      });
      if (entry) setPageSlot(entry.slotId);
    };
    dialog.show({
      title: t('training.addScopeTitle', { name: exerciseDisplayName(exercise, locale) }),
      message: t('training.addScopeBody'),
      actions: [
        { label: t('training.addToday'), style: 'confirm', onPress: () => add(false) },
        { label: t('training.addKeep'), onPress: () => add(true) },
        { label: t('common.cancel'), style: 'cancel' },
      ],
    });
  };
  const chipOf = (p: PlannedSlot): SessionChip => ({
    slotId: p.slotId,
    label: `${ordered.indexOf(p) + 1}. ${p.name}`,
    shortLabel: `${ordered.indexOf(p) + 1}. ${exerciseShortName({ id: p.exerciseId, name: p.name }, locale)}`,
    state: slotState(p, doneFor(p.exerciseId)),
    hasNote: notedIds.has(p.exerciseId),
  });

  // The strip is the navigation: it scrolls, and a tap opens an exercise.
  // Arrows flank it only while a chip is lifted, to move that chip one place
  // (44 dp, as tall as the chips); paging arrows beside it cost a line's width
  // for what a scroll and a tap already do.
  const NAV_BTN = 'h-11 w-11 shrink-0 items-center justify-center rounded-field bg-ink-800';
  const moveButton = (side: 'left' | 'right') => {
    const disabled = side === 'left' ? liftedIndex <= 0 : liftedIndex >= active.length - 1;
    return (
      <Pressable
        onPress={() => moveLifted(side === 'left' ? -1 : 1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t(side === 'left' ? 'training.moveEarlier' : 'training.moveLater')}
        accessibilityState={{ disabled }}
        className={[NAV_BTN, disabled ? 'opacity-40' : ''].join(' ')}
      >
        {side === 'left' ? (
          <ChevronLeftIcon color={muted} size={16} />
        ) : (
          <ChevronRightIcon color={muted} size={16} />
        )}
      </Pressable>
    );
  };
  const exerciseChips =
    planned.length > 0 ? (
      <View className="mb-3 flex-row items-center gap-2">
        {lifted ? moveButton('left') : null}
        <View className="min-w-0 flex-1">
          <SessionChipStrip
            active={active.map(chipOf)}
            missed={missed.map(chipOf)}
            focused={current?.slotId ?? null}
            lifted={lifted}
            onPress={onChip}
            onLongPress={lift}
            onAdd={() => setAddOpen(true)}
          />
        </View>
        {lifted ? moveButton('right') : null}
      </View>
    ) : null;

  // A focused field clears the keyboard by the app-wide room plus whatever
  // rides on it under the scroll view: the rest bar, the finish bar.
  const scrollBottomOffset =
    KEYBOARD_CLEARANCE + (rest ? restBarHeight : 0) + (settled ? finishBarHeight : 0);

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
            // abandon steps inward and confirms. A reopened session has no
            // abandon: its sets were a finished session.
            <View className="flex-row items-center gap-2">
              {reopened ? null : (
                <IconButton
                  icon={<XIcon color={danger} size={18} />}
                  onPress={cancel}
                  accessibilityLabel={t('training.cancelWorkout')}
                />
              )}
              <IconButton
                icon={<CheckIcon color={brandContrast} size={18} />}
                onPress={requestFinish}
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
        {/* Unit toggle (small, pinned here, never in the top bar) · position, or
         * how to put a lifted exercise down while one is being moved. */}
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
            numberOfLines={2}
            className={[
              'min-w-0 flex-1 text-right font-mono-medium text-xs uppercase tracking-wider',
              lifted ? 'text-brand' : 'text-ink-400',
            ].join(' ')}
          >
            {lifted
              ? t('training.reorderHint')
              : planned.length
                ? t('training.exerciseOf', { n: idx + 1, total: planned.length })
                : ''}
          </Text>
        </View>
      </View>

      {/* The screen's padding lifts everything under the scroll view above the
       * keyboard — the rest bar too — so a focused field keeps the app-wide
       * clearance for the actions under it (the set row's check, the note's
       * Save) plus that bar while a rest shows: with only its own 24 dp, it
       * landed behind the timer and its buttons under the keyboard. */}
      <SessionScroll
        className="flex-1"
        contentContainerClassName="grow px-5 pb-2"
        bottomOffset={scrollBottomOffset}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // No stretch at the ends (Android 12+): while it relaxes it catches the
        // next touch, so a swipe on the chip strip right after a scroll was lost.
        overScrollMode="never"
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
              prefill={prefill}
              effortMode={effortMode}
              facts={factsById.get(current.exerciseId) ?? null}
              loadSetting={settingById.get(current.exerciseId) ?? null}
              userId={user.id}
              hasNote={notedIds.has(current.exerciseId)}
              sessionExerciseIds={sessionExerciseIds}
              guardOrder={guardOrder(current.slotId)}
              requestEffort={requestEffort}
              onSkipped={onSkipped}
              onLogged={onLogged}
            />
          </>
        ) : null}
      </SessionScroll>

      {rest ? (
        <View
          onLayout={(e) => setRestBarHeight(e.nativeEvent.layout.height)}
          className="gap-3 px-5 pb-2 pt-3"
        >
          <RestTimer
            key={rest.startedAt}
            endsAt={rest.endsAt}
            onExtend={(seconds) => void extendRest(seconds)}
            onDone={() => void endRest()}
          />
        </View>
      ) : null}

      {/* Every planned set is settled — in practice a session reopened from its
       * summary (the last check finishes a session on its own): one tap closes
       * it again and lands on the summary. It rides the keyboard under the
       * scroll view, like the rest bar. */}
      {settled ? (
        <View
          onLayout={(e) => setFinishBarHeight(e.nativeEvent.layout.height)}
          className="gap-2 border-t border-ink-800 px-5 pb-2 pt-3"
        >
          {reopened ? (
            <Text className="text-xs leading-4 text-ink-400">{t('training.reopenedHint')}</Text>
          ) : null}
          <Button
            variant="brand"
            size="lg"
            label={t('training.finish')}
            leftIcon={<CheckIcon color={brandContrast} size={18} />}
            onPress={requestFinish}
          />
        </View>
      ) : null}

      {/* Effort sheet — the one place an effort gets reported, in the session's mode. */}
      <EffortSheet
        visible={!!effortResolve}
        mode={effortMode}
        onPick={(e) => effortResolve?.(e)}
        onClose={() => effortResolve?.(null)}
      />

      <AddExerciseSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        userId={user.id}
        exclude={sessionExerciseIds}
        onPick={addExercise}
      />
      <BlockingOverlay
        visible={blocking.busy !== null}
        onShow={blocking.onShow}
        label={t(blocking.busy === 'discarding' ? 'training.abandoning' : 'training.finishing')}
      />
    </Screen>
  );
};

export default WorkoutSession;
