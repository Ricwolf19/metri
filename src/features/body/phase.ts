import type { BodyPhase, Sex } from '@/db/schema';
import type { TranslationKey } from '@/i18n/en';

/**
 * Which phase fits a body-fat level. A SUGGESTION, shown with its reason — the
 * lifter may have a meet, a holiday or a preference the number knows nothing
 * about, so the editor pre-selects this and never locks it.
 *
 * Bands are inclusive upper bounds, checked in order.
 */
const BANDS: Record<Sex, readonly { upToPct: number; phase: BodyPhase }[]> = {
  male: [
    { upToPct: 12, phase: 'bulk' },
    { upToPct: 15, phase: 'recomp' },
    { upToPct: Infinity, phase: 'cut' },
  ],
  female: [
    { upToPct: 20, phase: 'bulk' },
    { upToPct: 24, phase: 'recomp' },
    { upToPct: Infinity, phase: 'cut' },
  ],
};

export type PhaseSuggestion = { phase: BodyPhase; reasonKey: TranslationKey };

/** Null when there is nothing to reason from — better silent than guessing. */
export const suggestPhase = ({
  sex,
  bodyFatPct,
}: {
  sex: Sex | null;
  bodyFatPct: number | null;
}): PhaseSuggestion | null => {
  if (!sex || bodyFatPct == null || !(bodyFatPct > 0)) return null;
  const band = BANDS[sex].find((b) => bodyFatPct <= b.upToPct) ?? BANDS[sex][2];
  return { phase: band.phase, reasonKey: `goal.reason.${band.phase}` };
};
