import { MISSED } from './adherence-colors';
import type { BalanceStatus } from './muscle-load';
import { THEME_VARS, type ThemeScheme } from '@/theme/tokens';

type Theme = { scheme: ThemeScheme; brand: string };

/**
 * Fills for the body map. Same discipline as `adherence-colors.ts`: every
 * colour the map can paint lives here, never inline in a component.
 *
 * Hue alone is not the signal. Red/amber/green is unreadable for the ~8% of
 * men with a red-green deficiency, so each state also differs in **fill
 * density**, and every view pairs the figure with a labelled legend.
 */

/** The adherence calendar's red, reused so "bad" is one colour across the app. */
const OVER = MISSED;
const UNDER = '#f59e0b';

const rgb = (scheme: ThemeScheme, token: string) => `rgb(${THEME_VARS[scheme][token]})`;

/** `#rrggbb` + 0–1 opacity → `#rrggbbaa`. Both ramps below fade one hue rather
 * than switching colour, so the scale stays readable without hue perception. */
const withAlpha = (hex: string, alpha: number): string =>
  `${hex}${Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')}`;

/** Muscle with no recorded work in the window — bare, not coloured. */
export const untrainedFill = (theme: Theme): string => rgb(theme.scheme, '--ink-750');

/**
 * Balance view: below the productive band, inside it, or past it.
 * `optimal` uses brand so "good" reads the same as a trained day elsewhere.
 */
export const balanceFill = (theme: Theme, status: BalanceStatus): string => {
  if (status === 'untrained') return untrainedFill(theme);
  if (status === 'low') return UNDER;
  if (status === 'high') return OVER;
  return theme.brand;
};

/**
 * Fatigue view: one hue, ramped by opacity, because fatigue is a continuum
 * rather than a set of categories. `index` is 0–1.
 */
export const fatigueFill = (theme: Theme, index: number): string => {
  if (index <= 0) return untrainedFill(theme);
  return withAlpha(OVER, 0.15 + index * 0.85);
};

/** Days after which a muscle reads as detrained rather than merely resting. */
export const DETRAINED_DAYS = 14;

/**
 * Strength/recency view: recently trained is brand, then fades toward bare as
 * the muscle goes untouched, and flips to amber once it looks abandoned.
 */
export const recencyFill = (theme: Theme, daysSince: number | null): string => {
  if (daysSince == null) return untrainedFill(theme);
  if (daysSince >= DETRAINED_DAYS) return UNDER;
  const freshness = 1 - daysSince / DETRAINED_DAYS;
  return withAlpha(theme.brand, Math.max(0.15, freshness));
};
