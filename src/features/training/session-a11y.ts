import type { EffortMode } from '@/db/schema';
import type { TFunction } from '@/i18n';

import { rirText } from './effort-mode';
import { effortWords } from './labels';
import type { Effort } from './workout-drafts';

/**
 * What a screen reader says about the live session. The visible rows are
 * terse ("60 kg × 8 @ RIR 2") and some of their meaning is colour or a glyph,
 * so each control gets a sentence instead. Pure: the screens only announce.
 */

/**
 * "2 in reserve", "5+ in reserve", "Failure", or nothing when the set carries
 * no effort — spoken as the row draws it (`effortWords`: "RIR 5+"). In simple
 * mode the row draws the band, so the band is what is heard ("Hard").
 */
export const effortPhrase = (
  effort: Effort | null | undefined,
  t: TFunction,
  mode: EffortMode,
): string | null => {
  if (!effort) return null;
  if (mode === 'simple')
    return effortWords({ rir: effort.rir, isFailure: effort.failure }, t, mode);
  if (effort.failure) return t('training.failure');
  return effort.rir == null ? null : `${rirText(effort.rir)} ${t('training.effortRir')}`;
};

/** The RIR chip names what it holds, not only what it is: "Effort: 2 in reserve". */
export const effortChipLabel = (
  effort: Effort | null | undefined,
  t: TFunction,
  mode: EffortMode,
): string =>
  t('training.effortValue', {
    value: effortPhrase(effort, t, mode) ?? t('training.effortUnset'),
  });

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
export const loggedSetLabel = (
  set: SetFacts & { effort?: Effort | null },
  t: TFunction,
  mode: EffortMode,
): string =>
  [
    t('training.loggedSetA11y', { n: set.n, weight: weightPhrase(set), reps: set.reps }),
    effortPhrase(set.effort, t, mode),
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
