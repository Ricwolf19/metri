import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  programs,
  routines,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  type IntensityType,
  type Program,
  type Routine,
  type SetGroup,
  type WeekConfig,
  type WorkoutDay,
  type WorkoutDayExercise,
} from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

import { getExerciseSetting } from './exercise-settings.repo';
import { exerciseHeads, type MuscleHead } from './muscles';

import { refreshTrainingWeekdays } from './enroll';

/** Template rows (`null`) vs the live copy of one enrollment. */
const scoped = (column: typeof routines.userProgramId, userProgramId: string | null) =>
  userProgramId == null ? isNull(column) : eq(column, userProgramId);

/* ── Reactive queries (for useLiveQuery in the editor) ───────────────────────── */

// Routine copies keep the template's `programId`, so every routine read must be
// scoped or the template editor would list the live copy's phases too.
export const routinesQuery = (programId: string, userProgramId: string | null = null) =>
  db
    .select()
    .from(routines)
    .where(and(eq(routines.programId, programId), scoped(routines.userProgramId, userProgramId)))
    .orderBy(asc(routines.orderIndex));

export const daysQuery = (routineId: string) =>
  db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .orderBy(asc(workoutDays.orderIndex));

export const slotsQuery = (dayId: string) =>
  db
    .select({ slot: workoutDayExercises, exercise: exercises })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .where(eq(workoutDayExercises.workoutDayId, dayId))
    .orderBy(asc(workoutDayExercises.orderIndex));

/** Muscles a split hits, derived from its exercises (there is no manual tag). */
export const dayMuscleHeads = (dayId: string): MuscleHead[] => {
  const rows = slotsQuery(dayId).all();
  const heads: MuscleHead[] = [];
  for (const { exercise } of rows) {
    for (const h of exerciseHeads(exercise)) {
      if (!heads.includes(h)) heads.push(h);
    }
  }
  return heads;
};

/**
 * Authoring repo — CRUD for user-built (and live-editable) program trees. Pure
 * logic, no UI. Every mutating call is scoped by `userProgramId`:
 *   - `null`  → a custom **template** (edit before enrolling; deep-copied on enroll).
 *   - string  → the **live copy** owned by an active enrollment (edit in place).
 * FKs aren't enforced, so deletes cascade manually (children first). Rows with an
 * `updatedAt` column get it stamped for future sync.
 */

export const MAX_BADGES = 5;
export const MAX_BADGE_LEN = 24;

/** The editable prescription fields of a week config (no id/week/scope). */
export type ConfigValues = {
  sets: number;
  reps: number;
  repsMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  toFailure: boolean;
  restSeconds: number | null;
  intensityType: IntensityType;
  intensityValue: number | null;
};

/** Sensible starting prescription for a freshly added exercise slot. */
const DEFAULT_CONFIG: ConfigValues = {
  sets: 3,
  reps: 8,
  repsMax: null,
  rirMin: 2,
  rirMax: 2,
  toFailure: false,
  restSeconds: null,
  intensityType: 'rir',
  intensityValue: null,
};

/* ── Program ────────────────────────────────────────────────────────────────── */

export type ProgramInput = {
  name: string;
  description?: string | null;
  durationWeeks?: number | null;
};

/** Create a custom program template (owned by the user, not yet enrolled). */
export const createCustomProgram = (userId: string, input: ProgramInput): Program => {
  const [row] = db
    .insert(programs)
    .values({
      id: randomId(),
      name: input.name,
      description: input.description ?? null,
      durationWeeks: input.durationWeeks ?? null,
      isCustom: true,
      userId,
      userProgramId: null,
    })
    .returning()
    .all();
  return row;
};

export const updateProgram = (programId: string, patch: Partial<ProgramInput>): void => {
  db.update(programs)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.durationWeeks !== undefined ? { durationWeeks: patch.durationWeeks } : {}),
      updatedAt: new Date(),
    })
    .where(eq(programs.id, programId))
    .run();
};

/**
 * Delete a template program and every template-scoped row beneath it. Refuses
 * (returns false) while an active/paused enrollment still points at it — the
 * live copy shares `programId`, and the enrollment would be left headless.
 */
export const deleteProgramTree = (programId: string): boolean => {
  const inUse = db
    .select({ id: userPrograms.id })
    .from(userPrograms)
    .where(
      and(
        eq(userPrograms.programId, programId),
        inArray(userPrograms.status, ['active', 'paused']),
      ),
    )
    .limit(1)
    .all();
  if (inUse.length) return false;

  const rts = db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.programId, programId), isNull(routines.userProgramId)))
    .all()
    .map((r) => r.id);
  const dys = rts.length
    ? db
        .select({ id: workoutDays.id })
        .from(workoutDays)
        .where(inArray(workoutDays.routineId, rts))
        .all()
        .map((d) => d.id)
    : [];
  const slts = dys.length
    ? db
        .select({ id: workoutDayExercises.id })
        .from(workoutDayExercises)
        .where(inArray(workoutDayExercises.workoutDayId, dys))
        .all()
        .map((s) => s.id)
    : [];
  const cfgIds = slts.length
    ? db
        .select({ id: weekConfigs.id })
        .from(weekConfigs)
        .where(inArray(weekConfigs.workoutDayExerciseId, slts))
        .all()
        .map((c) => c.id)
    : [];
  if (slts.length)
    db.delete(weekConfigs).where(inArray(weekConfigs.workoutDayExerciseId, slts)).run();
  if (dys.length)
    db.delete(workoutDayExercises).where(inArray(workoutDayExercises.workoutDayId, dys)).run();
  if (rts.length) db.delete(workoutDays).where(inArray(workoutDays.routineId, rts)).run();
  if (rts.length) db.delete(routines).where(inArray(routines.id, rts)).run();
  db.delete(programs).where(eq(programs.id, programId)).run();

  recordDeletion('week_configs', cfgIds);
  recordDeletion('workout_day_exercises', slts);
  recordDeletion('workout_days', dys);
  recordDeletion('routines', rts);
  recordDeletion('programs', programId);
  return true;
};

/* ── Routine (phase / "Cara") ────────────────────────────────────────────────── */

export const getRoutine = (id: string): Routine | null => {
  const [row] = db.select().from(routines).where(eq(routines.id, id)).all();
  return row ?? null;
};

const routineSiblings = (programId: string, userProgramId: string | null): Routine[] =>
  db
    .select()
    .from(routines)
    .where(and(eq(routines.programId, programId), scoped(routines.userProgramId, userProgramId)))
    .orderBy(asc(routines.orderIndex))
    .all();

export const addRoutine = (
  programId: string,
  userProgramId: string | null,
  input: { name: string; durationWeeks?: number },
): Routine => {
  const orderIndex = routineSiblings(programId, userProgramId).length;
  const [row] = db
    .insert(routines)
    .values({
      id: randomId(),
      programId,
      name: input.name,
      orderIndex,
      durationWeeks: input.durationWeeks ?? 4,
      userProgramId,
    })
    .returning()
    .all();
  return row;
};

export const updateRoutine = (
  routineId: string,
  patch: { name?: string; durationWeeks?: number },
): void => {
  db.update(routines)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.durationWeeks !== undefined ? { durationWeeks: patch.durationWeeks } : {}),
      updatedAt: new Date(),
    })
    .where(eq(routines.id, routineId))
    .run();
  if (patch.durationWeeks !== undefined) syncWeekConfigsForRoutine(routineId);
};

export const deleteRoutine = (routineId: string): void => {
  const routine = getRoutine(routineId);
  // On a live copy the enrollment may point at this phase: move it to the
  // first remaining sibling first, so nothing dangles.
  if (routine?.userProgramId) {
    const [enrollment] = db
      .select({ currentRoutineId: userPrograms.currentRoutineId })
      .from(userPrograms)
      .where(eq(userPrograms.id, routine.userProgramId))
      .all();
    if (enrollment?.currentRoutineId === routineId) {
      const next = routineSiblings(routine.programId, routine.userProgramId).find(
        (r) => r.id !== routineId,
      );
      db.update(userPrograms)
        .set({ currentRoutineId: next?.id ?? null, currentWeek: 1, updatedAt: new Date() })
        .where(eq(userPrograms.id, routine.userProgramId))
        .run();
    }
  }
  const dys = db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .all()
    .map((d) => d.id);
  for (const dayId of dys) deleteDay(dayId);
  db.delete(routines).where(eq(routines.id, routineId)).run();
  recordDeletion('routines', routineId);
  if (routine?.userProgramId) refreshTrainingWeekdays(routine.userProgramId);
};

/* ── Day (split) ─────────────────────────────────────────────────────────────── */

export const getDay = (id: string): WorkoutDay | null => {
  const [row] = db.select().from(workoutDays).where(eq(workoutDays.id, id)).all();
  return row ?? null;
};

const daySiblings = (routineId: string): WorkoutDay[] =>
  db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .orderBy(asc(workoutDays.orderIndex))
    .all();

export const addDay = (
  routineId: string,
  userProgramId: string | null,
  input: { name: string; focusMuscles?: string[] },
): WorkoutDay => {
  const orderIndex = daySiblings(routineId).length;
  const [row] = db
    .insert(workoutDays)
    .values({
      id: randomId(),
      routineId,
      name: input.name,
      focusMuscles: input.focusMuscles ?? null,
      orderIndex,
      userProgramId,
    })
    .returning()
    .all();
  return row;
};

export type DayPatch = {
  name?: string;
  focusMuscles?: string[] | null;
  /** Schedule fields are meaningful on the live copy only. */
  weekday?: number | null;
  startMinute?: number | null;
};

export const updateDay = (dayId: string, patch: DayPatch): void => {
  db.update(workoutDays)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.focusMuscles !== undefined ? { focusMuscles: patch.focusMuscles } : {}),
      ...(patch.weekday !== undefined ? { weekday: patch.weekday } : {}),
      ...(patch.startMinute !== undefined ? { startMinute: patch.startMinute } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workoutDays.id, dayId))
    .run();
  if (patch.weekday !== undefined) {
    const day = getDay(dayId);
    if (day?.userProgramId) refreshTrainingWeekdays(day.userProgramId);
  }
};

export const deleteDay = (dayId: string): void => {
  const day = getDay(dayId);
  const slts = db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.workoutDayId, dayId))
    .all()
    .map((s) => s.id);
  const cfgIds = slts.length
    ? db
        .select({ id: weekConfigs.id })
        .from(weekConfigs)
        .where(inArray(weekConfigs.workoutDayExerciseId, slts))
        .all()
        .map((c) => c.id)
    : [];
  if (slts.length)
    db.delete(weekConfigs).where(inArray(weekConfigs.workoutDayExerciseId, slts)).run();
  db.delete(workoutDayExercises).where(eq(workoutDayExercises.workoutDayId, dayId)).run();
  db.delete(workoutDays).where(eq(workoutDays.id, dayId)).run();
  recordDeletion('week_configs', cfgIds);
  recordDeletion('workout_day_exercises', slts);
  recordDeletion('workout_days', dayId);
  if (day?.userProgramId) refreshTrainingWeekdays(day.userProgramId);
};

/* ── Slot (exercise in a day) ────────────────────────────────────────────────── */

export const getSlot = (id: string): WorkoutDayExercise | null => {
  const [row] = db.select().from(workoutDayExercises).where(eq(workoutDayExercises.id, id)).all();
  return row ?? null;
};

const slotSiblings = (dayId: string): WorkoutDayExercise[] =>
  db
    .select()
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.workoutDayId, dayId))
    .orderBy(asc(workoutDayExercises.orderIndex))
    .all();

/** Add an exercise slot to a day and seed a default prescription for every week. */
export const addSlot = (
  dayId: string,
  userProgramId: string | null,
  exerciseId: string,
): WorkoutDayExercise => {
  const orderIndex = slotSiblings(dayId).length;
  // The program owner's per-exercise defaults seed the new slot.
  const owner =
    db
      .select({ userId: programs.userId })
      .from(workoutDays)
      .innerJoin(routines, eq(routines.id, workoutDays.routineId))
      .innerJoin(programs, eq(programs.id, routines.programId))
      .where(eq(workoutDays.id, dayId))
      .all()[0]?.userId ?? null;
  const preset = owner ? getExerciseSetting(owner, exerciseId) : null;
  const [slot] = db
    .insert(workoutDayExercises)
    .values({
      id: randomId(),
      workoutDayId: dayId,
      exerciseId,
      orderIndex,
      defaultRestSeconds: preset?.restSeconds ?? 120,
      badges: preset?.badges?.length ? preset.badges : null,
      alternativeExerciseIds: preset?.alternativeExerciseIds?.length
        ? preset.alternativeExerciseIds
        : null,
      userProgramId,
    })
    .returning()
    .all();

  const weeks = weeksForDay(dayId);
  for (let w = 1; w <= weeks; w++) {
    db.insert(weekConfigs)
      .values({
        id: randomId(),
        workoutDayExerciseId: slot.id,
        weekNumber: w,
        ...DEFAULT_CONFIG,
        userProgramId,
      })
      .run();
  }
  return slot;
};

/** Set the interchangeable alternatives for a slot ("deadlift or sumo"). */
export const setSlotAlternatives = (slotId: string, exerciseIds: string[]): void => {
  db.update(workoutDayExercises)
    .set({ alternativeExerciseIds: exerciseIds.length ? exerciseIds : null, updatedAt: new Date() })
    .where(eq(workoutDayExercises.id, slotId))
    .run();
};

/** Everything the slot editor buffers and writes back in one Save. */
export type SlotDraft = {
  defaultRestSeconds: number;
  badges: string[];
  weeks: { weekNumber: number; values: ConfigValues; setGroups: SetGroup[] | null }[];
};

const cleanBadges = (badges: string[]): string[] =>
  badges
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, MAX_BADGES)
    .map((b) => b.slice(0, MAX_BADGE_LEN));

/** Persist a slot draft: rest + badges on the slot, then every week's prescription. */
export const saveSlotDraft = (slotId: string, draft: SlotDraft): void => {
  const slot = getSlot(slotId);
  if (!slot) return;
  const badges = cleanBadges(draft.badges);
  db.update(workoutDayExercises)
    .set({
      defaultRestSeconds: draft.defaultRestSeconds,
      badges: badges.length ? badges : null,
      updatedAt: new Date(),
    })
    .where(eq(workoutDayExercises.id, slotId))
    .run();
  for (const week of draft.weeks) {
    upsertWeekConfig(slotId, week.weekNumber, slot.userProgramId, week.values, week.setGroups);
  }
};

export const deleteSlot = (slotId: string): void => {
  const cfgIds = db
    .select({ id: weekConfigs.id })
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .all()
    .map((c) => c.id);
  db.delete(weekConfigs).where(eq(weekConfigs.workoutDayExerciseId, slotId)).run();
  db.delete(workoutDayExercises).where(eq(workoutDayExercises.id, slotId)).run();
  recordDeletion('week_configs', cfgIds);
  recordDeletion('workout_day_exercises', slotId);
};

/* ── Prescription (week configs) ─────────────────────────────────────────────── */

export const getSlotConfigs = (slotId: string): WeekConfig[] =>
  db
    .select()
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .orderBy(asc(weekConfigs.weekNumber))
    .all();

/** Insert or update the prescription for one (slot, week). */
const upsertWeekConfig = (
  slotId: string,
  weekNumber: number,
  userProgramId: string | null,
  values: ConfigValues,
  setGroups?: SetGroup[] | null,
): void => {
  const groups = setGroups === undefined ? {} : { setGroups };
  const [existing] = db
    .select({ id: weekConfigs.id })
    .from(weekConfigs)
    .where(
      and(eq(weekConfigs.workoutDayExerciseId, slotId), eq(weekConfigs.weekNumber, weekNumber)),
    )
    .all();
  if (existing) {
    db.update(weekConfigs)
      .set({ ...values, ...groups, updatedAt: new Date() })
      .where(eq(weekConfigs.id, existing.id))
      .run();
  } else {
    db.insert(weekConfigs)
      .values({
        id: randomId(),
        workoutDayExerciseId: slotId,
        weekNumber,
        ...values,
        ...groups,
        userProgramId,
      })
      .run();
  }
};

/**
 * Reconcile a routine's week configs to its `durationWeeks`: add missing weeks
 * (copying the previous week or defaults) and drop weeks beyond the new length.
 */
const syncWeekConfigsForRoutine = (routineId: string): void => {
  const routine = getRoutine(routineId);
  if (!routine) return;
  const weeks = routine.durationWeeks;
  const days = daySiblings(routineId);
  for (const day of days) {
    for (const slot of slotSiblings(day.id)) {
      const configs = getSlotConfigs(slot.id);
      const byWeek = new Map(configs.map((c) => [c.weekNumber, c]));
      // Drop overflow weeks (tombstoned: week_configs is synced).
      const overflow = configs.filter((c) => c.weekNumber > weeks).map((c) => c.id);
      if (overflow.length) {
        db.delete(weekConfigs)
          .where(
            and(eq(weekConfigs.workoutDayExerciseId, slot.id), gt(weekConfigs.weekNumber, weeks)),
          )
          .run();
        recordDeletion('week_configs', overflow);
      }
      // Fill gaps up to the new length.
      let prev = byWeek.get(1) ? extractValues(byWeek.get(1)!) : { ...DEFAULT_CONFIG };
      for (let w = 1; w <= weeks; w++) {
        const existing = byWeek.get(w);
        if (existing) {
          prev = extractValues(existing);
        } else {
          upsertWeekConfig(slot.id, w, slot.userProgramId, prev);
        }
      }
    }
  }
};

/* ── Reorder (drag & drop writes the whole order) ──────────────────────────── */

// Each writer is guarded by the parent id (and scope for routines, whose copies
// share `programId`) so a stale id list can never renumber another tree.

export const reorderRoutines = (
  programId: string,
  userProgramId: string | null,
  orderedIds: string[],
): void => {
  const now = new Date();
  orderedIds.forEach((id, orderIndex) => {
    db.update(routines)
      .set({ orderIndex, updatedAt: now })
      .where(
        and(
          eq(routines.id, id),
          eq(routines.programId, programId),
          scoped(routines.userProgramId, userProgramId),
        ),
      )
      .run();
  });
};

export const reorderDays = (routineId: string, orderedIds: string[]): void => {
  const now = new Date();
  orderedIds.forEach((id, orderIndex) => {
    db.update(workoutDays)
      .set({ orderIndex, updatedAt: now })
      .where(and(eq(workoutDays.id, id), eq(workoutDays.routineId, routineId)))
      .run();
  });
};

export const reorderSlots = (dayId: string, orderedIds: string[]): void => {
  const now = new Date();
  orderedIds.forEach((id, orderIndex) => {
    db.update(workoutDayExercises)
      .set({ orderIndex, updatedAt: now })
      .where(and(eq(workoutDayExercises.id, id), eq(workoutDayExercises.workoutDayId, dayId)))
      .run();
  });
};

/* ── Internals ───────────────────────────────────────────────────────────────── */

const extractValues = (c: WeekConfig): ConfigValues => ({
  sets: c.sets,
  reps: c.reps,
  repsMax: c.repsMax,
  rirMin: c.rirMin,
  rirMax: c.rirMax,
  toFailure: c.toFailure,
  restSeconds: c.restSeconds,
  intensityType: c.intensityType,
  intensityValue: c.intensityValue,
});

const weeksForDay = (dayId: string): number => {
  const day = getDay(dayId);
  if (!day) return 1;
  const routine = getRoutine(day.routineId);
  return routine?.durationWeeks ?? 1;
};
