import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  programs,
  routines,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  workoutLogs,
  type UserProgram,
} from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

/** Live query of the user's enrollment (active or paused), so the UI reacts to enroll/finish. */
export const activeEnrollmentQuery = (userId: string) =>
  db
    .select()
    .from(userPrograms)
    .where(and(eq(userPrograms.userId, userId), ne(userPrograms.status, 'abandoned')))
    .orderBy(desc(userPrograms.createdAt));

/**
 * Enroll a user in a template program by **deep-copying** its structure into
 * user-owned rows tagged with the new `user_programs.id`. The template is never
 * mutated, so later customization stays isolated to this user's copy. The
 * `user_programs` row is written LAST — it's the commit point, so a failure
 * mid-copy leaves only orphan rows that are never queried.
 */
export const enrollInProgram = (
  userId: string,
  programId: string,
  trainingWeekdays?: number[],
): UserProgram => {
  const [program] = db.select().from(programs).where(eq(programs.id, programId)).all();
  if (!program) throw new Error('Program not found.');

  const userProgramId = randomId();

  // Load the template tree (all rows where userProgramId is null).
  const tplRoutines = db
    .select()
    .from(routines)
    .where(and(eq(routines.programId, programId), isNull(routines.userProgramId)))
    .orderBy(asc(routines.orderIndex))
    .all();
  if (tplRoutines.length === 0) throw new Error('Program has no routines to enroll.');

  const tplDays = db
    .select()
    .from(workoutDays)
    .where(
      inArray(
        workoutDays.routineId,
        tplRoutines.map((r) => r.id),
      ),
    )
    .all();
  const tplSlots = tplDays.length
    ? db
        .select()
        .from(workoutDayExercises)
        .where(
          inArray(
            workoutDayExercises.workoutDayId,
            tplDays.map((d) => d.id),
          ),
        )
        .all()
    : [];
  const tplConfigs = tplSlots.length
    ? db
        .select()
        .from(weekConfigs)
        .where(
          inArray(
            weekConfigs.workoutDayExerciseId,
            tplSlots.map((s) => s.id),
          ),
        )
        .all()
    : [];

  // template id -> fresh copy id, so child rows can re-point at their new parent.
  const idMap = new Map<string, string>();
  const copyId = (templateId: string): string => {
    const id = randomId();
    idMap.set(templateId, id);
    return id;
  };

  for (const r of tplRoutines) {
    db.insert(routines)
      .values({
        id: copyId(r.id),
        programId: r.programId,
        name: r.name,
        orderIndex: r.orderIndex,
        durationWeeks: r.durationWeeks,
        userProgramId,
      })
      .run();
  }

  for (const d of tplDays) {
    db.insert(workoutDays)
      .values({
        id: copyId(d.id),
        routineId: idMap.get(d.routineId)!,
        name: d.name,
        focusMuscles: d.focusMuscles,
        orderIndex: d.orderIndex,
        userProgramId,
      })
      .run();
  }

  for (const s of tplSlots) {
    db.insert(workoutDayExercises)
      .values({
        id: copyId(s.id),
        workoutDayId: idMap.get(s.workoutDayId)!,
        exerciseId: s.exerciseId,
        orderIndex: s.orderIndex,
        defaultRestSeconds: s.defaultRestSeconds,
        notes: s.notes,
        badges: s.badges,
        alternativeExerciseIds: s.alternativeExerciseIds,
        userProgramId,
      })
      .run();
  }

  for (const c of tplConfigs) {
    db.insert(weekConfigs)
      .values({
        id: randomId(),
        workoutDayExerciseId: idMap.get(c.workoutDayExerciseId)!,
        weekNumber: c.weekNumber,
        sets: c.sets,
        reps: c.reps,
        repsMax: c.repsMax,
        rirMin: c.rirMin,
        rirMax: c.rirMax,
        toFailure: c.toFailure,
        restSeconds: c.restSeconds,
        intensityType: c.intensityType,
        intensityValue: c.intensityValue,
        setGroups: c.setGroups,
        userProgramId,
      })
      .run();
  }

  const [enrollment] = db
    .insert(userPrograms)
    .values({
      id: userProgramId,
      userId,
      programId,
      status: 'active',
      startedAt: new Date(),
      currentRoutineId: idMap.get(tplRoutines[0].id)!,
      currentWeek: 1,
      trainingWeekdays: trainingWeekdays ?? null,
    })
    .returning()
    .all();

  return enrollment;
};

/**
 * Advance the enrolment after a finished session, when the current week is
 * complete (every day of the routine trained at this week number): next week →
 * next routine (by orderIndex, week 1) → program completed. Idempotent — safe
 * to call after every finish.
 */
export const advanceUserProgram = (userProgramId: string): void => {
  const [enrollment] = db
    .select()
    .from(userPrograms)
    .where(eq(userPrograms.id, userProgramId))
    .all();
  if (!enrollment || enrollment.status !== 'active') return;

  const owned = db
    .select()
    .from(routines)
    .where(eq(routines.userProgramId, userProgramId))
    .orderBy(asc(routines.orderIndex))
    .all();
  if (!owned.length) return;
  const current = owned.find((r) => r.id === enrollment.currentRoutineId) ?? owned[0];

  const days = db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .where(eq(workoutDays.routineId, current.id))
    .all();
  if (!days.length) return;
  const dayIds = new Set(days.map((d) => d.id));

  // Distinct days completed at this routine-relative week.
  const doneDayIds = new Set(
    db
      .select({ workoutDayId: workoutLogs.workoutDayId })
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userProgramId, userProgramId),
          eq(workoutLogs.weekNumber, enrollment.currentWeek),
          eq(workoutLogs.status, 'completed'),
        ),
      )
      .all()
      .map((r) => r.workoutDayId)
      .filter((id) => dayIds.has(id)),
  );
  if (doneDayIds.size < dayIds.size) return; // week not finished yet

  if (enrollment.currentWeek < current.durationWeeks) {
    setEnrollmentPosition(userProgramId, current.id, enrollment.currentWeek + 1);
    return;
  }
  const next = owned.find((r) => r.orderIndex > current.orderIndex);
  if (next) {
    setEnrollmentPosition(userProgramId, next.id, 1);
    return;
  }
  db.update(userPrograms)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(userPrograms.id, userProgramId))
    .run();
};

/** Update the user's position within their program (routine + relative week). */
export const setEnrollmentPosition = (
  userProgramId: string,
  currentRoutineId: string,
  currentWeek: number,
): void => {
  db.update(userPrograms)
    .set({ currentRoutineId, currentWeek, updatedAt: new Date() })
    .where(eq(userPrograms.id, userProgramId))
    .run();
};

/** Abandon an enrollment and delete its owned copy of the program structure. */
export const abandonEnrollment = (userProgramId: string): void => {
  // Capture ids first so the deletions can be tombstoned for sync.
  const cfgIds = db
    .select({ id: weekConfigs.id })
    .from(weekConfigs)
    .where(eq(weekConfigs.userProgramId, userProgramId))
    .all()
    .map((r) => r.id);
  const slotIds = db
    .select({ id: workoutDayExercises.id })
    .from(workoutDayExercises)
    .where(eq(workoutDayExercises.userProgramId, userProgramId))
    .all()
    .map((r) => r.id);
  const dayIds = db
    .select({ id: workoutDays.id })
    .from(workoutDays)
    .where(eq(workoutDays.userProgramId, userProgramId))
    .all()
    .map((r) => r.id);
  const routineIds = db
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.userProgramId, userProgramId))
    .all()
    .map((r) => r.id);

  db.delete(weekConfigs).where(eq(weekConfigs.userProgramId, userProgramId)).run();
  db.delete(workoutDayExercises).where(eq(workoutDayExercises.userProgramId, userProgramId)).run();
  db.delete(workoutDays).where(eq(workoutDays.userProgramId, userProgramId)).run();
  db.delete(routines).where(eq(routines.userProgramId, userProgramId)).run();
  recordDeletion('week_configs', cfgIds);
  recordDeletion('workout_day_exercises', slotIds);
  recordDeletion('workout_days', dayIds);
  recordDeletion('routines', routineIds);

  db.update(userPrograms)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(eq(userPrograms.id, userProgramId))
    .run();
};
