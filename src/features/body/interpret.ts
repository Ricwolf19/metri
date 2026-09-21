import type { BodyPhase } from '@/db/schema';
import type { TranslationKey } from '@/i18n/en';

/**
 * Reading the scale and the tape TOGETHER — neither means much alone. Weight up
 * with a smaller waist is a recomposition, not a failure; weight down with an
 * unchanged waist is the warning sign the scale by itself would have praised.
 *
 * Returns keys, never prose: the wording lives in the dictionaries.
 */

/** Smaller moves than these are measurement noise, week to week. */
const WEIGHT_NOISE_KG = 0.2;
const TAPE_NOISE_CM = 0.5;
/** Early in a phase a fast drop is mostly water and glycogen, not tissue. */
const WATER_WEEKS = 2;

type ReadingCode = 'recomp' | 'water' | 'muscleRisk' | 'overeating' | 'onTrack';
export type Reading = {
  code: ReadingCode;
  tone: 'good' | 'info' | 'warn';
  messageKey: TranslationKey;
};

const dir = (delta: number, noise: number): -1 | 0 | 1 =>
  delta > noise ? 1 : delta < -noise ? -1 : 0;

const reading = (code: ReadingCode, tone: Reading['tone']): Reading => ({
  code,
  tone,
  messageKey: `body.reading.${code}`,
});

/** Null when either side is missing — the point is never to judge weight alone. */
export const interpretWeek = ({
  phase,
  weightDeltaKg,
  keySiteDeltaCm,
  weekIndex,
}: {
  phase: BodyPhase | null;
  weightDeltaKg: number | null;
  keySiteDeltaCm: number | null;
  weekIndex: number;
}): Reading | null => {
  if (weightDeltaKg == null || keySiteDeltaCm == null) return null;
  const weight = dir(weightDeltaKg, WEIGHT_NOISE_KG);
  const tape = dir(keySiteDeltaCm, TAPE_NOISE_CM);

  if (weight >= 0 && tape < 0) return reading('recomp', 'good');
  if (weight < 0 && tape >= 0) {
    return weekIndex < WATER_WEEKS ? reading('water', 'info') : reading('muscleRisk', 'warn');
  }
  if (weight <= 0 && tape > 0) return reading('overeating', 'warn');
  if (phase === 'bulk' && tape > 0 && weight > 0 && keySiteDeltaCm > TAPE_NOISE_CM * 2) {
    return reading('overeating', 'warn');
  }
  return reading('onTrack', 'info');
};

/** What to pull before touching food — in the order they are worth trying. */
export const LEVERS = ['steps', 'cardio', 'progression', 'sleep', 'stress'] as const;
export const leverKey = (lever: (typeof LEVERS)[number]): TranslationKey => `body.lever.${lever}`;
