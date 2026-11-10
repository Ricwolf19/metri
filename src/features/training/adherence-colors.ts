import type { TrainingDayStatus } from '@/db/schema';
import type { TranslationKey } from '@/i18n';
import { THEME_VARS, tokenHex } from '@/theme/tokens';

type Theme = { brand: string; brandContrast: string };
type CellState = { status?: TrainingDayStatus; today?: boolean; future?: boolean };

/** Red-500: the one "missed" colour across calendar, strip and day sheet. */
export const MISSED = '#ef4444';
/** Text on the red fill stays near-black ("black letters" is the spec). */
const ON_MISSED = tokenHex('--brand-contrast');

const rgb = (token: string) => `rgb(${THEME_VARS[token]})`;

/**
 * How a calendar cell is drawn. Colour is never the only cue: under
 * deuteranopia lime and red both read olive with black digits, so a missed
 * day is also STRUCK through, a rest day carries an outline the unlogged days
 * do not, and today is ringed until it is answered.
 */
export type CellPaint = {
  fill: string;
  text: string;
  /** An outline (rest, today unanswered); none = no border. */
  border?: string;
  /** A line through the number — missed. */
  strike: boolean;
};

/** Fill + text for a calendar cell. Trained = brand with near-black digits, missed = red with
 * near-black digits struck through, other activity = mid gray with near-black digits, rest =
 * raised gray inside an outline, unlogged past = sunken gray, today unlogged = brand digits in a
 * brand ring, future = bare. */
export const adherenceCell = (theme: Theme, cell: CellState): CellPaint => {
  if (cell.status === 'trained')
    return { fill: theme.brand, text: theme.brandContrast, strike: false };
  if (cell.status === 'skipped') return { fill: MISSED, text: ON_MISSED, strike: true };
  // Near-black, not brand: lime on the ink-500 fill read 3.28:1.
  if (cell.status === 'active')
    return { fill: rgb('--ink-500'), text: theme.brandContrast, strike: false };
  if (cell.status === 'rest')
    return {
      fill: rgb('--ink-700'),
      text: rgb('--ink-300'),
      border: rgb('--ink-500'),
      strike: false,
    };
  if (cell.future) return { fill: 'transparent', text: rgb('--ink-500'), strike: false };
  if (cell.today)
    return { fill: rgb('--ink-750'), text: theme.brand, border: theme.brand, strike: false };
  return { fill: rgb('--ink-750'), text: rgb('--ink-400'), strike: false };
};

/** Dot/swatch colour for a status (week strip, day sheet, legend). */
export const adherenceDot = (theme: Theme, status: TrainingDayStatus | undefined): string => {
  if (status === 'trained') return theme.brand;
  if (status === 'skipped') return MISSED;
  if (status === 'active') return rgb('--ink-400');
  if (status === 'rest') return rgb('--ink-500');
  return 'transparent';
};

/**
 * The SHAPE of a status mark in the week strip, paired with `adherenceDot`'s
 * colour: rest (ink-500) and other activity (ink-400) sit 1.18:1 apart and
 * missed red merges with grey under protanopia, so each gets its own form.
 */
type AdherenceMark = 'dot' | 'ring' | 'cross' | 'none';

export const adherenceMark = (status: TrainingDayStatus | undefined): AdherenceMark => {
  if (status === 'trained' || status === 'active') return 'dot';
  if (status === 'rest') return 'ring';
  if (status === 'skipped') return 'cross';
  return 'none';
};

/** What a screen reader says a day is; null for a day still ahead (it has no status yet). */
export const adherenceStatusKey = (
  status: TrainingDayStatus | undefined,
  future: boolean,
): TranslationKey | null => {
  if (status === 'trained') return 'adherence.trained';
  if (status === 'skipped') return 'adherence.skipped';
  if (status === 'active') return 'adherence.active';
  if (status === 'rest') return 'adherence.rest';
  return future ? null : 'adherence.unmarked';
};
