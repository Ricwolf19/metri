import type { IntensityType, SetGroup, WeekConfig } from '@/db/schema';

import type { ConfigValues } from './authoring.repo';

/** One selector for effort: to-failure is an option, not a separate toggle —
 * a set can't be "RIR 2" and "to failure" at once. */
export type Method = 'failure' | IntensityType;

export type WeekDraft = {
  weekNumber: number;
  sets: number | null;
  reps: number | null;
  repsMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  method: Method | null;
  intensityValue: number | null;
  restSeconds: number;
  setGroups: SetGroup[] | null;
};

export const DEFAULT_REST = 120;

export const toWeekDraft = (c: WeekConfig, fallbackRest: number): WeekDraft => ({
  weekNumber: c.weekNumber,
  sets: c.sets,
  reps: c.reps,
  repsMax: c.repsMax,
  rirMin: c.rirMin,
  rirMax: c.rirMax,
  method: c.toFailure ? 'failure' : c.intensityType,
  intensityValue: c.intensityValue,
  restSeconds: c.restSeconds ?? fallbackRest,
  setGroups: c.setGroups ?? null,
});

/** A fresh slot starts deliberately unset: choosing effort, sets and reps is
 * the user's statement of intent, not a default we picked for them. */
export const toFreshDraft = (c: WeekConfig, fallbackRest: number): WeekDraft => ({
  weekNumber: c.weekNumber,
  sets: null,
  reps: null,
  repsMax: null,
  rirMin: null,
  rirMax: null,
  method: null,
  intensityValue: null,
  restSeconds: fallbackRest,
  setGroups: null,
});

export const isComplete = (w: WeekDraft): boolean => {
  if (w.sets == null || w.reps == null || w.method == null) return false;
  if (w.method === 'rir') return w.rirMin != null && w.rirMax != null;
  if (w.method === 'failure') return true;
  return w.intensityValue != null;
};

/** Draft → stored config. Cross-method fields are cleared so a stored row can
 * never claim RIR values under an RPE method (or vice versa). */
export const toValues = (w: WeekDraft): ConfigValues => ({
  sets: w.sets ?? 1,
  reps: w.reps ?? 1,
  repsMax: w.repsMax,
  rirMin: w.method === 'rir' ? w.rirMin : null,
  rirMax: w.method === 'rir' ? w.rirMax : null,
  toFailure: w.method === 'failure',
  restSeconds: w.restSeconds,
  intensityType: w.method === 'failure' || w.method == null ? 'rir' : w.method,
  intensityValue: w.method === 'rpe' || w.method === 'percentage' ? w.intensityValue : null,
});
