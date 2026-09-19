import type { TrainingDayStatus } from '@/db/schema';
import { THEME_VARS, type ThemeScheme } from '@/theme/tokens';

type Theme = { scheme: ThemeScheme; brand: string; brandContrast: string };
type CellState = { status?: TrainingDayStatus; today?: boolean; future?: boolean };

/** Red-500: the one "missed" colour across calendar, strip and day sheet. */
export const MISSED = '#ef4444';
/** Text on the red fill stays near-black in both schemes ("black letters" is the spec). */
const ON_MISSED = '#08090d';

const rgb = (scheme: ThemeScheme, token: string) => `rgb(${THEME_VARS[scheme][token]})`;

/** Fill + text for a calendar cell. Trained = brand on brand-contrast, missed = red on black,
 * rest = raised gray, unlogged past = sunken gray, today unlogged = brand text, future = bare. */
export const adherenceCell = (theme: Theme, cell: CellState): { fill: string; text: string } => {
  const { scheme } = theme;
  if (cell.status === 'trained') return { fill: theme.brand, text: theme.brandContrast };
  if (cell.status === 'skipped') return { fill: MISSED, text: ON_MISSED };
  if (cell.status === 'rest')
    return { fill: rgb(scheme, '--ink-700'), text: rgb(scheme, '--ink-300') };
  if (cell.future) return { fill: 'transparent', text: rgb(scheme, '--ink-600') };
  return {
    fill: rgb(scheme, '--ink-750'),
    text: cell.today ? theme.brand : rgb(scheme, '--ink-400'),
  };
};

/** Dot/swatch colour for a status (week strip, day sheet, legend). */
export const adherenceDot = (theme: Theme, status: TrainingDayStatus | undefined): string => {
  if (status === 'trained') return theme.brand;
  if (status === 'skipped') return MISSED;
  if (status === 'rest') return rgb(theme.scheme, '--ink-500');
  return 'transparent';
};
