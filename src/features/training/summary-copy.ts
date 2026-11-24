import type { EffortMode, LoadDetail } from '@/db/schema';
import type { TFunction } from '@/i18n';
import { formatNumber } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { effortWords } from './labels';
import { isPair } from './load';
import { fromKgHalf } from './progression';
import type { SessionTop } from './session-report';
import { weightText } from './set-prefill';

/**
 * The summary's words, shared by the summary screen and the share card so a
 * session reads the same in both. Pure: the copy is the key plus its params.
 */

/**
 * "+4.2 %", "−12 %": a change as a percentage, one decimal under ten. The minus
 * is the typographic one, as on the rest controls.
 */
export const signedPercent = (fraction: number): string => {
  const pct = Math.abs(fraction) * 100;
  const shown = pct < 10 ? Math.round(pct * 10) / 10 : Math.round(pct);
  // The sign of what is SHOWN: a change that rounds away reads "0 %", never "+0 %".
  return `${shown === 0 ? '' : fraction > 0 ? '+' : '−'}${formatNumber(shown, 1)} %`;
};

/** "+120", "−2", "0": a change in a count or a weight, already in the display unit. */
export const signedNumber = (value: number): string =>
  value > 0 ? `+${formatNumber(value)}` : value < 0 ? `−${formatNumber(-value)}` : '0';

/** Why the top exercise is the top one: the gain, the record, or its volume. */
export const topExerciseNote = (top: SessionTop, unit: Units, t: TFunction): string => {
  if (top.reason === 'progress' && top.gain != null) {
    return t('training.topProgress', { pct: signedPercent(top.gain) });
  }
  if (top.reason === 'record') return t('training.topRecord');
  return t('training.topVolume', { volume: fromKgHalf(top.volumeKg, unit), unit });
};

/** "60 kg × 8": a top set as every summary line reads it. */
export const setText = (set: { weightKg: number; reps: number }, unit: Units): string =>
  `${weightText(set.weightKg, unit)} ${unit} × ${set.reps}`;

/**
 * A logged set as the session's rows read it — "2 × 30 kg × 10 @ RIR 2",
 * "60 kg × 8 @ Hard" in simple mode — through the same effort helper.
 */
export const loggedSetText = (
  set: {
    weightKg: number;
    reps: number;
    rir: number | null;
    isFailure: boolean;
    load?: LoadDetail | null;
  },
  unit: Units,
  t: TFunction,
  mode: EffortMode,
): string => {
  const twoDumbbells = isPair(set.load);
  const effort = effortWords(set, t, mode);
  return `${twoDumbbells ? '2 × ' : ''}${setText(set, unit)}${effort ? ` @ ${effort}` : ''}`;
};
