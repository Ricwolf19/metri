import type { Routine } from '@/db/schema';
import { kgToLb } from '@/features/bmr/calc';
import type { Units } from '@/lib/storage';

/**
 * Pure helpers for program periodization. Weeks are stored **routine-relative**
 * (1–N within a routine); the absolute program week is derived by summing the
 * durations of the routines that come before the current one.
 */

/** Absolute program week (1-based) from the current routine + routine-relative week. */
export const deriveProgramWeek = (
  routines: Routine[],
  currentRoutineId: string | null,
  currentWeek: number,
): number => {
  const ordered = [...routines].sort((a, b) => a.orderIndex - b.orderIndex);
  let weeksBefore = 0;
  for (const r of ordered) {
    if (r.id === currentRoutineId) break;
    weeksBefore += r.durationWeeks;
  }
  return weeksBefore + currentWeek;
};

/** Total weeks across every routine in a program. */
export const totalProgramWeeks = (routines: Routine[]): number =>
  routines.reduce((sum, r) => sum + r.durationWeeks, 0);

/**
 * Estimated 1RM (Epley: `w × (1 + reps/30)`).
 *
 * Accurate enough in the 1–12 rep range and increasingly optimistic beyond it,
 * so high-rep sets are refused rather than silently inflating a PR chart.
 */
const EPLEY_MAX_REPS = 12;

export const estimate1Rm = (weightKg: number, reps: number): number | null => {
  if (!(weightKg > 0) || !(reps > 0) || reps > EPLEY_MAX_REPS) return null;
  return weightKg * (1 + reps / 30);
};

/** Inverse of {@link estimate1Rm}: the load that yields `reps` at a given e1RM. */
export const weightForReps = (oneRmKg: number, reps: number): number => oneRmKg / (1 + reps / 30);

/** Round a suggested load to the nearest usable plate increment (2.5 kg). */
export const roundToPlate = (weightKg: number, increment = 2.5): number =>
  Math.max(0, Math.round(weightKg / increment) * increment);

/** Kg → display unit, rounded to 1 decimal (UI-facing, not stored). */
export const fromKg = (kg: number, unit: Units): number =>
  Math.round((unit === 'lb' ? kgToLb(kg) : kg) * 10) / 10;
