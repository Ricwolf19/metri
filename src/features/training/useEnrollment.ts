import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import type { Program, Routine, UserProgram, WorkoutDay } from '@/db/schema';

import { daysQuery, routinesQuery } from './authoring.repo';
import { activeEnrollmentQuery } from './enroll';
import { getProgram } from './programs.repo';
import { deriveProgramWeek, totalProgramWeeks } from './progression';

export type EnrollmentStructure = {
  program: Program | null;
  routines: Routine[];
  currentRoutine: Routine | null;
  days: WorkoutDay[];
  programWeek: number;
  totalWeeks: number;
};

/** Active enrollment + live-copy structure via live queries, so copy edits re-render the Train tab without a remount. */
export const useEnrollment = (
  userId: string,
): { enrollment: UserProgram | null; structure: EnrollmentStructure | null; loaded: boolean } => {
  const { data: enrollments, updatedAt } = useLiveQuery(activeEnrollmentQuery(userId), [userId]);
  const enrollment = enrollments[0] ?? null;

  const enrollmentId = enrollment?.id ?? null;
  const programId = enrollment?.programId ?? null;
  const currentRoutineId = enrollment?.currentRoutineId ?? null;
  const currentWeek = enrollment?.currentWeek ?? 1;

  const { data: routines } = useLiveQuery(routinesQuery(programId ?? '', enrollmentId ?? ''), [
    programId,
    enrollmentId,
  ]);
  const currentRoutine = routines.find((r) => r.id === currentRoutineId) ?? routines[0] ?? null;
  const routineId = currentRoutine?.id ?? null;
  const { data: days } = useLiveQuery(daysQuery(routineId ?? ''), [routineId]);

  const program = useMemo(() => (programId ? getProgram(programId) : null), [programId]);

  const structure = useMemo<EnrollmentStructure | null>(() => {
    if (!enrollmentId || !programId) return null;
    return {
      program,
      routines,
      currentRoutine,
      days,
      programWeek: deriveProgramWeek(routines, currentRoutineId, currentWeek),
      totalWeeks: totalProgramWeeks(routines),
    };
  }, [
    enrollmentId,
    programId,
    program,
    routines,
    currentRoutine,
    days,
    currentRoutineId,
    currentWeek,
  ]);

  // `updatedAt` is undefined until the first query resolves — the moment to
  // show a skeleton instead of an empty tab.
  return { enrollment, structure, loaded: updatedAt !== undefined };
};
