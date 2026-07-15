import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import type { Program, Routine, UserProgram, WorkoutDay } from '@/db/schema';

import { activeEnrollmentQuery } from './enroll';
import { getProgram, getRoutines, getWorkoutDays } from './programs.repo';
import { deriveProgramWeek, totalProgramWeeks } from './progression';
import { lastCompletedDayId } from './session.repo';

export type EnrollmentStructure = {
  program: Program | null;
  routines: Routine[];
  currentRoutine: Routine | null;
  days: WorkoutDay[];
  programWeek: number;
  totalWeeks: number;
};

/**
 * Resolves the user's active enrollment and its current structure (program,
 * routine, this week's days). Shared by the training hub and Home so the two
 * never drift.
 */
export const useEnrollment = (
  userId: string,
): { enrollment: UserProgram | null; structure: EnrollmentStructure | null } => {
  const { data: enrollments } = useLiveQuery(activeEnrollmentQuery(userId));
  const enrollment = enrollments[0] ?? null;

  const structure = useMemo<EnrollmentStructure | null>(() => {
    if (!enrollment) return null;
    const program = getProgram(enrollment.programId);
    const routines = getRoutines(enrollment.programId, enrollment.id);
    const currentRoutine =
      routines.find((r) => r.id === enrollment.currentRoutineId) ?? routines[0] ?? null;
    const days = currentRoutine ? getWorkoutDays(currentRoutine.id) : [];
    return {
      program,
      routines,
      currentRoutine,
      days,
      programWeek: deriveProgramWeek(routines, enrollment.currentRoutineId, enrollment.currentWeek),
      totalWeeks: totalProgramWeeks(routines),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment?.id, enrollment?.currentRoutineId, enrollment?.currentWeek]);

  return { enrollment, structure };
};

/** The day to train next: the one after the last completed day, cycling. */
export const nextWorkoutDay = (userProgramId: string, days: WorkoutDay[]): WorkoutDay | null => {
  if (!days.length) return null;
  const lastId = lastCompletedDayId(userProgramId);
  if (!lastId) return days[0];
  const idx = days.findIndex((d) => d.id === lastId);
  return days[(idx + 1) % days.length] ?? days[0];
};
