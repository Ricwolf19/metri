import { and, asc, eq, gt, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  programs,
  routines,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  type IntensityType,
  type Program,
  type ProgramDifficulty,
  type ProgramGoal,
  type Routine,
  type WeekConfig,
  type WorkoutDay,
  type WorkoutDayExercise,
} from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

import { SPLIT_SCAFFOLDS, type SplitSize } from './splits';

/* ── Reactive queries (for useLiveQuery in the editor) ───────────────────────── */

export const routinesQuery = (programId: string) =>
  db
    .select()
    .from(routines)
    .where(eq(routines.programId, programId))
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

export const configsQuery = (slotId: string) =>
  db
    .select()
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .orderBy(asc(weekConfigs.weekNumber));

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
  difficulty?: ProgramDifficulty | null;
  goal?: ProgramGoal | null;
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
      difficulty: input.difficulty ?? null,
      goal: input.goal ?? null,
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
      ...(patch.difficulty !== undefined ? { difficulty: patch.difficulty } : {}),
      ...(patch.goal !== undefined ? { goal: patch.goal } : {}),
      ...(patch.durationWeeks !== undefined ? { durationWeeks: patch.durationWeeks } : {}),
      updatedAt: new Date(),
    })
    .where(eq(programs.id, programId))
    .run();
};

/** Delete a template program and every template-scoped row beneath it. */
export const deleteProgramTree = (programId: string): void => {
  const rts = db
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.programId, programId))
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
  db.delete(routines).where(eq(routines.programId, programId)).run();
  db.delete(programs).where(eq(programs.id, programId)).run();

  recordDeletion('week_configs', cfgIds);
  recordDeletion('workout_day_exercises', slts);
  recordDeletion('workout_days', dys);
  recordDeletion('routines', rts);
  recordDeletion('programs', programId);
};

/* ── Routine (phase / "Cara") ────────────────────────────────────────────────── */

export const getRoutine = (id: string): Routine | null => {
  const [row] = db.select().from(routines).where(eq(routines.id, id)).all();
  return row ?? null;
};

const routineSiblings = (programId: string): Routine[] =>
  db
    .select()
    .from(routines)
    .where(eq(routines.programId, programId))
    .orderBy(asc(routines.orderIndex))
    .all();

export const addRoutine = (
  programId: string,
  userProgramId: string | null,
  input: { name: string; durationWeeks?: number },
): Routine => {
  const orderIndex = routineSiblings(programId).length;
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
  const dys = db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .all()
    .map((d) => d.id);
  for (const dayId of dys) deleteDay(dayId);
  db.delete(routines).where(eq(routines.id, routineId)).run();
  recordDeletion('routines', routineId);
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

export const updateDay = (
  dayId: string,
  patch: { name?: string; focusMuscles?: string[] | null },
): void => {
  db.update(workoutDays)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.focusMuscles !== undefined ? { focusMuscles: patch.focusMuscles } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workoutDays.id, dayId))
    .run();
};

export const deleteDay = (dayId: string): void => {
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
};

/** Populate a routine with the empty days of a 3/4/5-day split. */
export const applySplitScaffold = (
  routineId: string,
  userProgramId: string | null,
  split: SplitSize,
): void => {
  for (const seed of SPLIT_SCAFFOLDS[split]) {
    addDay(routineId, userProgramId, { name: seed.name, focusMuscles: seed.focusMuscles });
  }
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
  const [slot] = db
    .insert(workoutDayExercises)
    .values({
      id: randomId(),
      workoutDayId: dayId,
      exerciseId,
      orderIndex,
      defaultRestSeconds: 120,
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

export const updateSlot = (
  slotId: string,
  patch: { defaultRestSeconds?: number | null; notes?: string | null },
): void => {
  db.update(workoutDayExercises)
    .set({
      ...(patch.defaultRestSeconds !== undefined
        ? { defaultRestSeconds: patch.defaultRestSeconds }
        : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workoutDayExercises.id, slotId))
    .run();
};

/** Set the coaching badges for a slot (validates count + length). */
export const setSlotBadges = (slotId: string, badges: string[]): void => {
  const clean = badges
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, MAX_BADGES)
    .map((b) => b.slice(0, MAX_BADGE_LEN));
  db.update(workoutDayExercises)
    .set({ badges: clean.length ? clean : null, updatedAt: new Date() })
    .where(eq(workoutDayExercises.id, slotId))
    .run();
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

const getSlotConfigs = (slotId: string): WeekConfig[] =>
  db
    .select()
    .from(weekConfigs)
    .where(eq(weekConfigs.workoutDayExerciseId, slotId))
    .orderBy(asc(weekConfigs.weekNumber))
    .all();

/** Insert or update the prescription for one (slot, week). */
export const upsertWeekConfig = (
  slotId: string,
  weekNumber: number,
  userProgramId: string | null,
  values: ConfigValues,
): void => {
  const [existing] = db
    .select({ id: weekConfigs.id })
    .from(weekConfigs)
    .where(
      and(eq(weekConfigs.workoutDayExerciseId, slotId), eq(weekConfigs.weekNumber, weekNumber)),
    )
    .all();
  if (existing) {
    db.update(weekConfigs)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(weekConfigs.id, existing.id))
      .run();
  } else {
    db.insert(weekConfigs)
      .values({
        id: randomId(),
        workoutDayExerciseId: slotId,
        weekNumber,
        ...values,
        userProgramId,
      })
      .run();
  }
};

/** Copy one week's prescription onto every week of the routine. */
export const copyWeekConfigToAll = (slotId: string, weekNumber: number): void => {
  const configs = getSlotConfigs(slotId);
  const source = configs.find((c) => c.weekNumber === weekNumber);
  if (!source) return;
  const values = extractValues(source);
  const weeks = weeksForSlot(slotId);
  for (let w = 1; w <= weeks; w++) {
    if (w === weekNumber) continue;
    upsertWeekConfig(slotId, w, source.userProgramId, values);
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
      // Drop overflow weeks.
      db.delete(weekConfigs)
        .where(
          and(eq(weekConfigs.workoutDayExerciseId, slot.id), gt(weekConfigs.weekNumber, weeks)),
        )
        .run();
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

/* ── Reorder (chevron up/down swaps orderIndex) ──────────────────────────────── */

type Ordered = { id: string; orderIndex: number };
const neighbor = <T extends Ordered>(siblings: T[], id: string, dir: -1 | 1): [T, T] | null => {
  const i = siblings.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= siblings.length) return null;
  return [siblings[i], siblings[j]];
};

export const moveRoutine = (routineId: string, dir: -1 | 1): void => {
  const r = getRoutine(routineId);
  if (!r) return;
  const pair = neighbor(routineSiblings(r.programId), routineId, dir);
  if (!pair) return;
  const now = new Date();
  db.update(routines)
    .set({ orderIndex: pair[1].orderIndex, updatedAt: now })
    .where(eq(routines.id, pair[0].id))
    .run();
  db.update(routines)
    .set({ orderIndex: pair[0].orderIndex, updatedAt: now })
    .where(eq(routines.id, pair[1].id))
    .run();
};

export const moveDay = (dayId: string, dir: -1 | 1): void => {
  const d = getDay(dayId);
  if (!d) return;
  const pair = neighbor(daySiblings(d.routineId), dayId, dir);
  if (!pair) return;
  const now = new Date();
  db.update(workoutDays)
    .set({ orderIndex: pair[1].orderIndex, updatedAt: now })
    .where(eq(workoutDays.id, pair[0].id))
    .run();
  db.update(workoutDays)
    .set({ orderIndex: pair[0].orderIndex, updatedAt: now })
    .where(eq(workoutDays.id, pair[1].id))
    .run();
};

export const moveSlot = (slotId: string, dir: -1 | 1): void => {
  const s = getSlot(slotId);
  if (!s) return;
  const pair = neighbor(slotSiblings(s.workoutDayId), slotId, dir);
  if (!pair) return;
  db.update(workoutDayExercises)
    .set({ orderIndex: pair[1].orderIndex, updatedAt: new Date() })
    .where(eq(workoutDayExercises.id, pair[0].id))
    .run();
  db.update(workoutDayExercises)
    .set({ orderIndex: pair[0].orderIndex, updatedAt: new Date() })
    .where(eq(workoutDayExercises.id, pair[1].id))
    .run();
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

const weeksForSlot = (slotId: string): number => {
  const slot = getSlot(slotId);
  return slot ? weeksForDay(slot.workoutDayId) : 1;
};
