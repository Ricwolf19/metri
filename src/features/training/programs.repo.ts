import { and, asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  programs,
  routines,
  workoutDays,
  type Program,
  type Routine,
  type WorkoutDay,
} from '@/db/schema';

/** Live query of the built-in program templates (not user-owned copies). */
export const programTemplatesQuery = () =>
  db.select().from(programs).where(isNull(programs.userProgramId)).orderBy(asc(programs.name));

export const getProgram = (id: string): Program | null => {
  const [row] = db.select().from(programs).where(eq(programs.id, id)).all();
  return row ?? null;
};

/** Routines for a program — template rows (`userProgramId` null) by default. */
export const getRoutines = (programId: string, userProgramId: string | null = null): Routine[] =>
  db
    .select()
    .from(routines)
    .where(
      and(
        eq(routines.programId, programId),
        userProgramId == null
          ? isNull(routines.userProgramId)
          : eq(routines.userProgramId, userProgramId),
      ),
    )
    .orderBy(asc(routines.orderIndex))
    .all();

export const getWorkoutDay = (id: string): WorkoutDay | null => {
  const [row] = db.select().from(workoutDays).where(eq(workoutDays.id, id)).all();
  return row ?? null;
};

/** Workout days within a routine, ordered. */
export const getWorkoutDays = (routineId: string): WorkoutDay[] =>
  db
    .select()
    .from(workoutDays)
    .where(eq(workoutDays.routineId, routineId))
    .orderBy(asc(workoutDays.orderIndex))
    .all();

/** All routines + their days for a program, as a nested preview structure. */
export type RoutineWithDays = Routine & { days: WorkoutDay[] };

export const getProgramStructure = (
  programId: string,
  userProgramId: string | null = null,
): RoutineWithDays[] =>
  getRoutines(programId, userProgramId).map((r) => ({ ...r, days: getWorkoutDays(r.id) }));
