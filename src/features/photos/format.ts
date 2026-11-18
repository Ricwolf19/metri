import { fromCm, lengthUnitFor } from '@/features/body/units';
import { MIN_WEIGH_INS } from '@/features/body/weekly';
import { fromKg } from '@/features/training/progression';
import type { ProgressPhoto } from '@/db/schema';
import type { TFunction } from '@/i18n';
import type { Units } from '@/lib/storage';

import { poseLabelKey } from './checkins';
import type { CheckinStats, CompareDelta } from './stats';

/**
 * How progress numbers read, everywhere they show (timeline, a check-in,
 * the comparison, a share card): one wording, the user's units, a sign on
 * every change. Pure, so cards and screens can never disagree.
 */

/** "Cut · week 6", or null outside a phase. */
export const phaseLine = (t: TFunction, stats: CheckinStats): string | null =>
  stats.phase
    ? t('photos.phaseWeek', { phase: t(`goal.phase.${stats.phase.phase}`), week: stats.phase.week })
    : null;

/** "82.4", the number alone (a `Stat` draws the unit beside it) — a weekly average under `MIN_WEIGH_INS` readings gets a "~". */
export const avgWeightValue = (stats: CheckinStats, units: Units): string | null =>
  stats.avgKg == null
    ? null
    : `${stats.weighIns < MIN_WEIGH_INS ? '~' : ''}${fromKg(stats.avgKg, units)}`;

/** "82.4 kg", "~82.4 kg". */
export const avgWeightText = (stats: CheckinStats, units: Units): string | null => {
  const value = avgWeightValue(stats, units);
  return value == null ? null : `${value} ${units}`;
};

/** "84 cm" / "33.1 in". */
export const siteText = (cm: number | null, units: Units): string | null =>
  cm == null ? null : `${fromCm(cm, units)} ${lengthUnitFor(units)}`;

const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0');

/** "−6.2 kg", "+0.4 kg", "±0 kg". */
export const deltaWeightText = (kg: number | null, units: Units): string | null =>
  kg == null ? null : `${signed(fromKg(kg, units))} ${units}`;

export const deltaSiteText = (cm: number | null, units: Units): string | null =>
  cm == null ? null : `${signed(fromCm(cm, units))} ${lengthUnitFor(units)}`;

/** "84 days" / "1 day". */
export const daysText = (t: TFunction, delta: CompareDelta): string =>
  t(delta.days === 1 ? 'photos.dayOne' : 'photos.days', { n: delta.days });

/** A clip's length: "0:09", "1:05". */
export const clipLengthText = (ms: number | null): string | null => {
  if (ms == null) return null;
  const s = Math.max(1, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** What a screen reader hears for a thumbnail: "Play clip, 0:09", "Open Front". */
export const mediaLabel = (
  t: TFunction,
  media: Pick<ProgressPhoto, 'kind' | 'pose' | 'durationMs'>,
): string =>
  media.kind === 'video'
    ? t('photos.openClip', { length: clipLengthText(media.durationMs) ?? '' })
    : t('photos.openPose', {
        pose: media.pose ? t(poseLabelKey(media.pose)) : t('photos.untagged'),
      });
