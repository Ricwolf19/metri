import type { MediaAlign, ProgressPose } from '@/db/schema';
import type { TFunction } from '@/i18n';
import type { Units } from '@/lib/storage';

import { photoForPose, poseLabelKey } from './checkins';
import {
  avgWeightText,
  daysText,
  deltaSiteText,
  deltaWeightText,
  phaseLine,
  siteText,
} from './format';
import { compareDelta } from './stats';
import type { ProgressEntry } from './useProgressLog';

/**
 * What a progress card says, built as plain data (like `sessionShareModel`) so
 * the card stays a view and the copy is tested without one. The lifter picks
 * 1–4 check-ins and a pose; the template follows the count.
 */

export type ShareTemplate = 'single' | 'pair' | 'timeline';
/** `changes` (the default) never prints a body weight: only what moved. */
export type ShareStatsMode = 'changes' | 'full' | 'none';

export const MAX_PANELS = 4;

export const templateFor = (count: number): ShareTemplate =>
  count <= 1 ? 'single' : count === 2 ? 'pair' : 'timeline';

export type SharePanel = {
  mediaId: string;
  /** The STORED path; the view resolves it through `mediaUri`. */
  uri: string;
  image: { width: number | null; height: number | null };
  align: MediaAlign | null;
  /** "Cut · week 6", or the date when no phase ran. */
  label: string;
  /** The date under a phase label; null when the label already is the date. */
  sublabel: string | null;
};

type ShareChip = { label: string; value: string; detail: string | null };

export type ProgressShareModel = {
  template: ShareTemplate;
  /** "Progress · Front". */
  eyebrow: string;
  /** "12 Aug → 4 Nov" across a span; a single's own label. */
  title: string;
  panels: SharePanel[];
  chips: ShareChip[];
};

export const progressShareModel = (input: {
  /** Chronological (oldest first); only those holding `pose` become panels. */
  entries: readonly ProgressEntry[];
  pose: ProgressPose;
  stats: ShareStatsMode;
  units: Units;
  /** The key tape site's name ("Waist"). */
  siteLabel: string;
  /** A check-in date ('YYYY-MM-DD') as the card prints it ("12 Aug"). */
  dayMonth: (key: string) => string;
  t: TFunction;
}): ProgressShareModel => {
  const { pose, stats, units, siteLabel, dayMonth, t } = input;
  const withPhoto = input.entries
    .flatMap((entry) => {
      const photo = photoForPose(entry, pose);
      return photo ? [{ entry, photo }] : [];
    })
    .slice(0, MAX_PANELS);

  const panels: SharePanel[] = withPhoto.map(({ entry, photo }) => {
    const phase = phaseLine(t, entry.stats);
    const date = dayMonth(entry.checkin.date);
    return {
      mediaId: photo.id,
      uri: photo.uri,
      image: { width: photo.width, height: photo.height },
      align: photo.align,
      label: phase ?? date,
      sublabel: phase ? date : null,
    };
  });

  const first = withPhoto[0]?.entry;
  const last = withPhoto[withPhoto.length - 1]?.entry;
  const chips: ShareChip[] = [];
  const push = (label: string, value: string | null, detail: string | null = null) => {
    if (value) chips.push({ label, value, detail });
  };

  if (first && last && stats !== 'none') {
    if (first === last) {
      // One check-in has no change to show: only `full` prints its numbers.
      if (stats === 'full') {
        push(t('progressShare.chipWeight'), avgWeightText(first.stats, units));
        push(siteLabel, siteText(first.stats.siteCm, units));
      }
    } else {
      const delta = compareDelta(
        { date: first.checkin.date, stats: first.stats },
        { date: last.checkin.date, stats: last.stats },
      );
      const span = (a: string | null, b: string | null) =>
        stats === 'full' && a && b ? `${a} → ${b}` : null;
      push(
        t('progressShare.chipWeight'),
        deltaWeightText(delta.kg, units),
        span(avgWeightText(first.stats, units), avgWeightText(last.stats, units)),
      );
      push(
        siteLabel,
        deltaSiteText(delta.cm, units),
        span(siteText(first.stats.siteCm, units), siteText(last.stats.siteCm, units)),
      );
      push(t('progressShare.chipSpan'), daysText(t, delta));
    }
  }

  const title =
    first && last && first !== last
      ? t('progressShare.range', {
          from: dayMonth(first.checkin.date),
          to: dayMonth(last.checkin.date),
        })
      : (panels[0]?.label ?? '');

  return {
    template: templateFor(panels.length),
    eyebrow: t('progressShare.eyebrow', { pose: t(poseLabelKey(pose)) }),
    title,
    panels,
    chips,
  };
};

/** The card's three shapes, as height ÷ width: a story, a feed post, a square. */
export type ShareFormat = 'story' | 'post' | 'square';
export const FORMAT_RATIO: Record<ShareFormat, number> = { story: 16 / 9, post: 5 / 4, square: 1 };

/**
 * How `count` 3:4 photos fill an `area`: every columns × rows split that holds
 * them is tried and the one drawing the LARGEST photo wins (a pair sits side
 * by side, four go two by two, three fill a row unless the area is tall).
 */
export const panelGrid = (
  count: number,
  area: { width: number; height: number },
  gap: number,
): { cols: number; rows: number; width: number; height: number } => {
  let best = { cols: 1, rows: 1, width: 0, height: 0 };
  const n = Math.max(1, count);
  for (let cols = 1; cols <= n; cols += 1) {
    const rows = Math.ceil(n / cols);
    const byWidth = (area.width - gap * (cols - 1)) / cols;
    const byHeight = ((area.height - gap * (rows - 1)) / rows) * (3 / 4);
    const width = Math.max(0, Math.floor(Math.min(byWidth, byHeight)));
    if (width > best.width) best = { cols, rows, width, height: Math.floor((width * 4) / 3) };
  }
  return best;
};

/** Up to `MAX_PANELS` of `items` spread evenly, first and last always in (the grid's opening picks). */
export const spreadPicks = <T>(items: readonly T[]): T[] => {
  if (items.length <= MAX_PANELS) return [...items];
  const last = items.length - 1;
  const at = new Set(
    Array.from({ length: MAX_PANELS }, (_, i) => Math.round((i * last) / (MAX_PANELS - 1))),
  );
  return [...at].map((i) => items[i]);
};
