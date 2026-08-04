import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import type { Program, Routine, UserProgram, WorkoutDay } from '@/db/schema';

import { activeEnrollmentQuery } from './enroll';
import { getProgram, getRoutines, getWorkoutDays } from './programs.repo';
import { deriveProgramWeek, totalProgramWeeks } from './progression';

export type EnrollmentStructure = {
  program: Program | null;
  routines: Routine[];
  currentRoutine: Routine | null;
  days: WorkoutDay[];
  programWeek: number;
  totalWeeks: number;
};

export const useEnrollment = (
  userId: string,
): { enrollment: UserProgram | null; structure: EnrollmentStructure | null } => {
  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(userId));
  const enrollment = enrollments[0] ?? null;

  const enrollmentId = enrollment?.id ?? null;
  const programId = enrollment?.programId ?? null;
  const currentRoutineId = enrollment?.currentRoutineId ?? null;
  const currentWeek = enrollment?.currentWeek ?? 1;

  const structure = useMemo<EnrollmentStructure | null>(() => {
    if (!enrollmentId || !programId) return null;
    const program = getProgram(programId);
    const routines = getRoutines(programId, enrollmentId);
    const currentRoutine = routines.find((r) => r.id === currentRoutineId) ?? routines[0] ?? null;
    const days = currentRoutine ? getWorkoutDays(currentRoutine.id) : [];
    return {
      program,
      routines,
      currentRoutine,
      days,
      programWeek: deriveProgramWeek(routines, currentRoutineId, currentWeek),
      totalWeeks: totalProgramWeeks(routines),
    };
  }, [enrollmentId, programId, currentRoutineId, currentWeek]);

  return { enrollment, structure };
};
