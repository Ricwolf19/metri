import type { ShareCardProps } from '@/components/ui';
import type { TFunction } from '@/i18n';
import type { Units } from '@/lib/storage';

import { bestSetOf, type ExerciseSessionPoint } from '../training/exercise-trend';
import { fromKgHalf } from '../training/progression';
import type { SessionSummary } from '../training/session.repo';

/**
 * What a share card says, built as plain data so every entry point (the finish
 * modal, an exercise, a plan, later the Metrics cards) renders the ONE template
 * and the copy can be tested without a view. A card is a PNG the lifter builds
 * and hands to the OS share sheet themselves: nothing leaves the device on its
 * own, and no card ever carries a progress photo.
 */
export type ShareModel = ShareCardProps;

/** How many exercise rows fit under the title before the card grows past a screen. */
const MAX_ROWS = 8;
/** Enough sessions for a sparkline to read as a trend, not a scribble. */
const SPARK_POINTS = 12;

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

export const exerciseShareModel = (input: {
  name: string;
  points: readonly ExerciseSessionPoint[];
  unit: Units;
  formatDate: (at: number) => string;
  t: TFunction;
}): ShareModel => {
  const { name, points, unit, formatDate, t } = input;
  const bestSet = bestSetOf(points);
  const bestE1rm = Math.max(0, ...points.map((p) => p.e1rmKg ?? 0));
  const prs = points.filter((p) => p.isPr).length;
  // The line prefers the e1RM; a high-rep lift with no e1RM falls back to the top set.
  const spark = points
    .slice(-SPARK_POINTS)
    .map((p) => p.e1rmKg ?? p.topKg)
    .map((kg) => fromKgHalf(kg, unit));
  const lines = [...points]
    .slice(-3)
    .reverse()
    .map(
      (p) =>
        `${formatDate(p.at)} · ${p.sets
          .map((s) => `${fromKgHalf(s.weightKg, unit)}×${s.reps}`)
          .join(' · ')}`,
    );
  return {
    eyebrow: t('share.exerciseEyebrow'),
    title: name,
    subtitle: t('share.sessionsCount', { n: points.length }),
    metrics: [
      {
        label: t('share.bestSet'),
        value: bestSet ? `${fromKgHalf(bestSet.weightKg, unit)}×${bestSet.reps}` : '—',
      },
      {
        label: t('share.bestE1rm'),
        value: bestE1rm ? `${fromKgHalf(bestE1rm, unit)} ${unit}` : '—',
      },
      { label: t('share.prs'), value: `${prs}` },
    ],
    spark,
    lines,
    footer: t('share.footer'),
  };
};

export const routineShareModel = (input: {
  programName: string;
  /** "Phase 2 · Week 3 of 12", or similar. */
  phaseLine: string;
  days: readonly { name: string; exercises: readonly { id: string; name: string }[] }[];
  t: TFunction;
}): ShareModel => {
  const { programName, phaseLine, days, t } = input;
  return {
    eyebrow: t('share.planEyebrow'),
    title: programName,
    subtitle: phaseLine,
    // Full names; the card clamps each line to one row with an ellipsis.
    lines: days.map((d) => `${d.name} · ${d.exercises.map((e) => e.name).join(' · ')}`),
    footer: t('share.footer'),
  };
};
