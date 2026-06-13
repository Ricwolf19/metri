import type { Routine, WeekConfig } from '@/db/schema';

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

/** "4 × 6" sets-by-reps summary. */
export const formatSetsReps = (sets: number, reps: number): string => `${sets} × ${reps}`;

/**
 * Short intensity tag for a week config, e.g. "RIR 2-3", "RIR 2", "Failure",
 * "RPE 8", "70%". `failureLabel` is injected so the caller supplies the i18n.
 */
export const formatIntensity = (config: WeekConfig, failureLabel: string): string => {
  if (config.toFailure) return failureLabel;
  if (config.intensityType === 'rpe' && config.intensityValue != null) {
    return `RPE ${config.intensityValue}`;
  }
  if (config.intensityType === 'percentage' && config.intensityValue != null) {
    return `${config.intensityValue}%`;
  }
  if (config.rirMin == null && config.rirMax == null) return '';
  if (config.rirMin === config.rirMax || config.rirMax == null) return `RIR ${config.rirMin}`;
  if (config.rirMin == null) return `RIR ${config.rirMax}`;
  return `RIR ${config.rirMin}-${config.rirMax}`;
};

/** Round a suggested load to the nearest usable plate increment (2.5 kg). */
export const roundToPlate = (weightKg: number, increment = 2.5): number =>
  Math.max(0, Math.round(weightKg / increment) * increment);
