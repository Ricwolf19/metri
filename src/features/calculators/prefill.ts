import type { CalcConfig, CalcValues } from './types';

export type PrefillProfile = {
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyFatPct: number | null;
  activityLevel: string | null;
};

export type PrefillTape = { neck?: number; waist?: number; hips?: number };

/** In these the `weight` field is the load on the bar, not the lifter. */
const LOAD_WEIGHT_CALCS = new Set(['onerm', 'plates']);

/**
 * Starting values for a calculator: the field defaults, overridden by what the
 * profile and the latest tape already know. Without it the body-fat calculator
 * opened on a generic 180 cm male and disagreed with the check-in's estimate,
 * which runs the same formula on the lifter's own numbers (C1).
 */
export const initialCalcValues = (
  config: CalcConfig,
  profile: PrefillProfile | null,
  tape: PrefillTape = {},
): CalcValues => {
  const known: Record<string, number | string | null | undefined> = {
    sex: profile?.sex,
    age: profile?.age,
    height: profile?.heightCm,
    weight: LOAD_WEIGHT_CALCS.has(config.id) ? null : profile?.weightKg,
    bodyweight: profile?.weightKg,
    bodyFat: profile?.bodyFatPct,
    activity: profile?.activityLevel,
    neck: tape.neck,
    waist: tape.waist,
    hip: tape.hips,
  };

  return Object.fromEntries(
    config.fields.map((field) => {
      const value = known[field.name];
      if (field.kind === 'select') {
        const valid = typeof value === 'string' && field.options.some((o) => o.value === value);
        return [field.name, valid ? value : field.default];
      }
      const inRange =
        typeof value === 'number' &&
        value > 0 &&
        value >= (field.min ?? 0) &&
        value <= (field.max ?? Infinity);
      return [field.name, inRange ? value : field.default];
    }),
  );
};
