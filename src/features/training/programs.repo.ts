import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  programs,
  routines,
  workoutDayExercises,
  workoutDays,
  type Program,
  type Routine,
  type WorkoutDay,
} from '@/db/schema';

import type { ProgramTree } from './schedule';

/** Live query of the curated templates ("Recommended by metri"). */
export const recommendedProgramsQuery = () =>
  db
    .select()
    .from(programs)
    .where(and(isNull(programs.userProgramId), eq(programs.isCustom, false)))
    .orderBy(asc(programs.name));

/** Live query of the user's own templates, most recently edited first. */
export const ownProgramsQuery = (userId: string) =>
  db
    .select()
    .from(programs)
    .where(
      and(isNull(programs.userProgramId), eq(programs.isCustom, true), eq(programs.userId, userId)),
    )
    .orderBy(desc(programs.updatedAt));

export const getProgram = (id: string): Program | null => {
  const [row] = db.select().from(programs).where(eq(programs.id, id)).all();
  return row ?? null;
};

/** Routines for a program — template rows (`userProgramId` null) by default. */
const getRoutines = (programId: string, userProgramId: string | null = null): Routine[] =>
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

/** Phase → split tree (template, or an enrollment's live copy) with slot counts — enough for start
 * validation and the preview without loading exercise rows. */
export const getProgramTree = (
  programId: string,
  userProgramId: string | null = null,
): ProgramTree => {
  const rts = getRoutines(programId, userProgramId);
  if (!rts.length) return { routines: [] };
  const days = db
    .select()
    .from(workoutDays)
    .where(
      inArray(
        workoutDays.routineId,
        rts.map((r) => r.id),
      ),
    )
    .orderBy(asc(workoutDays.orderIndex))
    .all();
  const counts = days.length
    ? db
        .select({ dayId: workoutDayExercises.workoutDayId, n: count() })
        .from(workoutDayExercises)
        .where(
          inArray(
            workoutDayExercises.workoutDayId,
            days.map((d) => d.id),
          ),
        )
        .groupBy(workoutDayExercises.workoutDayId)
        .all()
    : [];
  const countByDay = new Map(counts.map((c) => [c.dayId, c.n]));
  return {
    routines: rts.map((r) => ({
      ...r,
      days: days
        .filter((d) => d.routineId === r.id)
        .map((d) => ({ ...d, slotCount: countByDay.get(d.id) ?? 0 })),
    })),
  };
};
