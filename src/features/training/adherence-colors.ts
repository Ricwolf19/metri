import type { TrainingDayStatus } from '@/db/schema';
import { THEME_VARS } from '@/theme/tokens';

type Theme = { brand: string; brandContrast: string };
type CellState = { status?: TrainingDayStatus; today?: boolean; future?: boolean };

/** Red-500: the one "missed" colour across calendar, strip and day sheet. */
export const MISSED = '#ef4444';
/** Text on the red fill stays near-black ("black letters" is the spec). */
const ON_MISSED = '#08090d';

const rgb = (token: string) => `rgb(${THEME_VARS[token]})`;

/** Fill + text for a calendar cell. Trained = brand on brand-contrast, missed = red on black,
 * other activity = mid gray with brand text, rest = raised gray, unlogged past = sunken gray,
 * today unlogged = brand text, future = bare. */
export const adherenceCell = (theme: Theme, cell: CellState): { fill: string; text: string } => {
  if (cell.status === 'trained') return { fill: theme.brand, text: theme.brandContrast };
  if (cell.status === 'skipped') return { fill: MISSED, text: ON_MISSED };
  if (cell.status === 'active') return { fill: rgb('--ink-500'), text: theme.brand };
  if (cell.status === 'rest') return { fill: rgb('--ink-700'), text: rgb('--ink-300') };
  if (cell.future) return { fill: 'transparent', text: rgb('--ink-600') };
  return {
    fill: rgb('--ink-750'),
    text: cell.today ? theme.brand : rgb('--ink-400'),
  };
};

/** Dot/swatch colour for a status (week strip, day sheet, legend). */
export const adherenceDot = (theme: Theme, status: TrainingDayStatus | undefined): string => {
  if (status === 'trained') return theme.brand;
  if (status === 'skipped') return MISSED;
  if (status === 'active') return rgb('--ink-400');
  if (status === 'rest') return rgb('--ink-500');
  return 'transparent';
};
