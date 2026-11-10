import type { ShareCardProps } from '@/components/ui';
import type { TFunction } from '@/i18n';
import type { Units } from '@/lib/storage';

import { fromKgHalf } from '../training/progression';
import type { SessionSummary } from '../training/session.repo';

/**
 * What a share card says, built as plain data so every place that shares a
 * session (the finish modal, a day in the calendar) renders the ONE template
 * and the copy can be tested without a view. @see AGENTS.md "Share cards" for
 * what a card may carry.
 */
export type ShareModel = ShareCardProps;

/** How many exercise rows fit under the title before the card grows past a screen. */
const MAX_ROWS = 8;

export const sessionShareModel = (input: {
  summary: SessionSummary;
  splitName: string;
  /** "Program · Week 3", or null outside a program. */
  programLine: string | null;
  unit: Units;
  t: TFunction;
}): ShareModel => {
  const { summary, splitName, programLine, unit, t } = input;
  const rows = summary.exercises.slice(0, MAX_ROWS).map((e) => ({
    name: e.name,
    detail: `${fromKgHalf(e.topKg, unit)}×${e.topReps} ${unit}`,
    pr: e.isPr,
  }));
  const hidden = summary.exercises.length - rows.length;
  return {
    eyebrow: t('share.workoutDone'),
    title: splitName,
    subtitle: programLine ?? undefined,
    metrics: [
      { label: t('share.volume'), value: `${fromKgHalf(summary.volumeKg, unit)} ${unit}` },
      { label: t('share.sets'), value: `${summary.setCount}` },
      { label: t('share.duration'), value: `${Math.round(summary.durationSeconds / 60)}m` },
    ],
    rows,
    lines: hidden > 0 ? [t('share.more', { n: hidden })] : [],
    footer: t('share.footer'),
  };
};
