import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  programs,
  routines,
  userPrograms,
  weekConfigs,
  workoutDayExercises,
  workoutDays,
  type UserProgram,
} from '@/db/schema';
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
export const enrollInProgram = (userId: string, programId: string): UserProgram => {
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
        rirMin: c.rirMin,
        rirMax: c.rirMax,
        toFailure: c.toFailure,
        restSeconds: c.restSeconds,
        intensityType: c.intensityType,
        intensityValue: c.intensityValue,
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
    })
    .returning()
    .all();

  return enrollment;
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
  db.delete(weekConfigs).where(eq(weekConfigs.userProgramId, userProgramId)).run();
  db.delete(workoutDayExercises).where(eq(workoutDayExercises.userProgramId, userProgramId)).run();
  db.delete(workoutDays).where(eq(workoutDays.userProgramId, userProgramId)).run();
  db.delete(routines).where(eq(routines.userProgramId, userProgramId)).run();
  db.update(userPrograms)
    .set({ status: 'abandoned', updatedAt: new Date() })
    .where(eq(userPrograms.id, userProgramId))
    .run();
};
