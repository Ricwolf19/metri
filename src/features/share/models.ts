import type { ShareCardProps } from '@/components/ui';
import type { TFunction } from '@/i18n';
import type { Units } from '@/lib/storage';

import { fromKgHalf } from '../training/progression';
import { durationText } from '../training/session-report';
import { weightText } from '../training/set-prefill';
import type { SessionSummary } from '../training/session.repo';
import { topExerciseNote } from '../training/summary-copy';

/**
 * What a share card says, built as plain data so every place that shares a
 * session (the summary screen, a day in the calendar) renders the ONE template
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
  // The weight as the session screen and the summary write it (a 21.25 kg
  // one-post set stays 21.25, never rounded to the half).
  const setDetail = (kg: number, reps: number) => `${weightText(kg, unit)}×${reps} ${unit}`;
  const rows = summary.exercises.slice(0, MAX_ROWS).map((e) => ({
    name: e.name,
    detail: setDetail(e.topKg, e.topReps),
    pr: e.isPr,
  }));
  const hidden = summary.exercises.length - rows.length;
  const { top } = summary;
  return {
    eyebrow: t('share.workoutDone'),
    title: splitName,
    subtitle: programLine ?? undefined,
    // The session's headline: the exercise it is remembered by, and why.
    highlight: top
      ? {
          label: t('share.top'),
          title: top.name,
          detail: setDetail(top.topKg, top.topReps),
          note: topExerciseNote(top, unit, t),
        }
      : undefined,
    metrics: [
      { label: t('share.duration'), value: durationText(summary.durationSeconds) },
      { label: t('share.volume'), value: `${fromKgHalf(summary.volumeKg, unit)} ${unit}` },
      { label: t('share.sets'), value: `${summary.setCount}` },
      { label: t('share.prs'), value: `${summary.exercises.filter((e) => e.isPr).length}` },
    ],
    rows,
    lines: hidden > 0 ? [t('share.more', { n: hidden })] : [],
    footer: t('share.footer'),
  };
};
