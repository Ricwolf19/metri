import type { TFunction } from '@/i18n';

import type { Trend } from './set-prefill';
import type { Effort } from './workout-drafts';

/**
 * What a screen reader says about the live session. The visible rows are
 * terse ("60 kg × 8 · RIR 2") and some of their meaning is colour or a glyph,
 * so each control gets a sentence instead. Pure: the screens only announce.
 */

/** "2 in reserve", "Failure", or nothing when the set carries no effort. */
export const effortPhrase = (effort: Effort | null | undefined, t: TFunction): string | null => {
  if (effort?.failure) return t('training.failure');
  if (effort?.rir != null) return `${effort.rir} ${t('training.effortRir')}`;
  return null;
};

/** The RIR chip names what it holds, not only what it is: "Effort: 2 in reserve". */
export const effortChipLabel = (effort: Effort | null | undefined, t: TFunction): string =>
  t('training.effortValue', { value: effortPhrase(effort, t) ?? t('training.effortUnset') });

/** "More than last time" / "Less than last time"; a same or missing reference says nothing. */
export const trendPhrase = (trend: Trend | null | undefined, t: TFunction): string | null =>
  trend === 'up' ? t('training.aboveLast') : trend === 'down' ? t('training.belowLast') : null;

type SetFacts = {
  /** The row's number as the lifter reads it (1-based). */
  n: number | string;
  /** Already in the display unit (`weightText`). */
  weight: string;
  unit: string;
  reps: number;
  /** Two dumbbells read "2 × 30 kg", the count first, as the row draws it. */
  twoDumbbells?: boolean;
};

const weightPhrase = ({ weight, unit, twoDumbbells }: SetFacts) =>
  `${twoDumbbells ? '2 × ' : ''}${weight} ${unit}`;

/** A logged set read as ONE element: "Set 2: 60 kg, 8 reps, 2 in reserve". */
export const loggedSetLabel = (set: SetFacts & { effort?: Effort | null }, t: TFunction): string =>
  [
    t('training.loggedSetA11y', { n: set.n, weight: weightPhrase(set), reps: set.reps }),
    effortPhrase(set.effort, t),
  ]
    .filter(Boolean)
    .join(', ');

/** Spoken once the check lands: nothing else on screen says the set was written. */
export const setLoggedAnnouncement = (set: SetFacts, t: TFunction): string =>
  t('training.setLoggedA11y', { n: set.n, weight: weightPhrase(set), reps: set.reps });

/** What a ± tap changed: focus stays on the button, so the field's new value is spoken. */
export const bumpAnnouncement = (
  field: 'weight' | 'reps',
  value: string,
  unit: string,
  t: TFunction,
): string =>
  field === 'weight'
    ? `${t('training.weight')}: ${value} ${unit}`
    : `${t('training.reps')}: ${value}`;
