import type { EffortMode, Equipment, IntensityType, SetGroup } from '@/db/schema';
import type { Locale, TFunction } from '@/i18n';
import type { TranslationKey } from '@/i18n/en';

import { effortBand, rirText, type EffortBand, type LoggedEffort } from './effort-mode';
import { EXERCISE_NAMES } from './exercise-content';
import { abbreviateName, EXERCISE_SHORT_NAMES } from './exercise-short-names';

export const EQUIPMENT_KEY: Record<Equipment, TranslationKey> = {
  barbell: 'equipment.barbell',
  dumbbell: 'equipment.dumbbell',
  machine: 'equipment.machine',
  cable: 'equipment.cable',
  bodyweight: 'equipment.bodyweight',
  kettlebell: 'equipment.kettlebell',
  other: 'equipment.other',
};

export const INTENSITY_KEY: Record<IntensityType, TranslationKey> = {
  rir: 'intensity.rir',
  rpe: 'intensity.rpe',
  percentage: 'intensity.percentage',
};

/** i18n keys by expo weekday. */
export const WEEKDAY_KEY: Record<number, TranslationKey> = {
  1: 'weekday.sun',
  2: 'weekday.mon',
  3: 'weekday.tue',
  4: 'weekday.wed',
  5: 'weekday.thu',
  6: 'weekday.fri',
  7: 'weekday.sat',
};

/** Monday-first expo weekday numbers, for chip rows. */
export const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

// Single source for weekday initials (expo numbering).
const LETTER: Record<string, Record<number, string>> = {
  en: { 1: 'S', 2: 'M', 3: 'T', 4: 'W', 5: 'T', 6: 'F', 7: 'S' },
  es: { 1: 'D', 2: 'L', 3: 'M', 4: 'M', 5: 'J', 6: 'V', 7: 'S' },
};

export const weekdayLetter = (locale: string, weekday: number): string =>
  (LETTER[locale] ?? LETTER.en)[weekday];

/** Monday-first single-letter headers (calendar / week strip). */
export const DAY_LETTERS: Record<string, string[]> = Object.fromEntries(
  Object.keys(LETTER).map((locale) => [locale, DAY_ORDER.map((w) => weekdayLetter(locale, w))]),
);

/** Localized catalog name for seeded exercises; customs pass through raw. */
export const exerciseDisplayName = (ex: { id: string; name: string }, locale: Locale): string =>
  EXERCISE_NAMES[ex.id]?.[locale] ?? ex.name;

/** The session strip's chip text: the catalog's short name, else one derived from the name. */
export const exerciseShortName = (ex: { id: string; name: string }, locale: Locale): string =>
  EXERCISE_SHORT_NAMES[ex.id]?.[locale] ?? abbreviateName(exerciseDisplayName(ex, locale));

/** Unnamed phases render a slug fallback ("phase-2") instead of a stored fake name. */
export const routineDisplayName = (
  routine: { name: string; orderIndex: number },
  t: TFunction,
): string => routine.name.trim() || t('editor.phaseFallback', { n: routine.orderIndex + 1 });

/** Unnamed splits render a slug fallback ("split-1"). */
export const dayDisplayName = (day: { name: string; orderIndex: number }, t: TFunction): string =>
  day.name.trim() || t('editor.splitFallback', { n: day.orderIndex + 1 });

/** One planned set, as far as its target line needs it. */
export type SetTarget = {
  reps: number;
  repsMax?: number;
  /** RIR range or to-failure; '' when the prescription names no effort. */
  intensity: string;
  /** Top set / back-off when the prescription has several groups, else null. */
  groupName: string | null;
};

/** "8" or "8–10": the reps a set or a group asks for. */
const repsRange = (r: { reps: number; repsMax?: number }): string =>
  `${r.reps}${r.repsMax ? `–${r.repsMax}` : ''}`;

/** The effort a set group asks for: "Failure", "RIR 2", "RIR 1-2" or nothing. */
export const groupIntensity = (g: SetGroup, t: TFunction): string => {
  if (g.toFailure) return t('training.failure');
  if (g.rirMin == null && g.rirMax == null) return '';
  if (g.rirMax == null || g.rirMin === g.rirMax) return `RIR ${g.rirMin ?? g.rirMax}`;
  if (g.rirMin == null) return `RIR ${g.rirMax}`;
  return `RIR ${g.rirMin}-${g.rirMax}`;
};

/**
 * What a set is expected to be, in one line: "Top set · Target: 6–8 reps @ RIR 1".
 * The reps AND the effort, so the lifter never has to decode a bare "RIR 1-2".
 */
export const targetLine = (row: SetTarget, t: TFunction): string => {
  const reps = repsRange(row);
  const target = row.intensity
    ? t('training.targetEffort', { reps, effort: row.intensity })
    : t('training.target', { reps });
  return [row.groupName, target].filter(Boolean).join(' · ');
};

/** A logged set's effort, as the past-set chips draw it: to failure, or a reserve marker. */
type EffortMark = { failure: true } | { failure: false; text: string };

/**
 * A simple-mode band's word ("Hard") and the line under it in the effort sheet
 * ("1–2 reps left"). Failure is the plan's own word in either mode.
 */
export const EFFORT_BAND_COPY: Record<EffortBand, { label: TranslationKey; line: TranslationKey }> =
  {
    failure: { label: 'training.failure', line: 'training.effortFailureLine' },
    hard: { label: 'training.effortHard', line: 'training.effortHardLine' },
    moderate: { label: 'training.effortModerate', line: 'training.effortModerateLine' },
    easy: { label: 'training.effortEasy', line: 'training.effortEasyLine' },
  };

/** The three effort-logging modes as the program screen offers them. */
export const EFFORT_MODE_COPY: Record<
  EffortMode,
  { label: TranslationKey; caption: TranslationKey; description: TranslationKey }
> = {
  rir: {
    label: 'program.effortRir',
    caption: 'program.effortRirCaption',
    description: 'program.effortRirBody',
  },
  simple: {
    label: 'program.effortSimple',
    caption: 'program.effortSimpleCaption',
    description: 'program.effortSimpleBody',
  },
  free: {
    label: 'program.effortFree',
    caption: 'program.effortFreeCaption',
    description: 'program.effortFreeBody',
  },
};

/**
 * The same effort in words, as a plan target names it ("12 reps @ RIR 2"):
 * "RIR 2", "RIR 5+", "Failure"; null when the set carries none. A session in
 * simple mode reads every set as its band ("Hard", `effortBand`), whatever
 * scale logged it; `free` keeps the professional notation.
 */
export const effortWords = (set: LoggedEffort, t: TFunction, mode: EffortMode): string | null => {
  if (mode === 'simple') {
    const band = effortBand(set);
    return band ? t(EFFORT_BAND_COPY[band].label) : null;
  }
  if (set.isFailure) return t('training.failure');
  return set.rir == null ? null : `RIR ${rirText(set.rir)}`;
};

/**
 * The compact marker after a past set's "60 kg × 8": `@2`, `@5+` (simple mode:
 * `@ Hard`), or failure — which the caller draws as the flame glyph, the
 * session's own sign for it. Null when the set carries no effort. Failure wins
 * over its stored `rir: 0`.
 */
export const effortMark = (
  set: LoggedEffort,
  t: TFunction,
  mode: EffortMode,
): EffortMark | null => {
  if (set.isFailure) return { failure: true };
  if (set.rir == null) return null;
  return mode === 'simple'
    ? { failure: false, text: `@ ${effortWords(set, t, mode)}` }
    : { failure: false, text: `@${rirText(set.rir)}` };
};

/**
 * A set group as a plan reads it: "Top set · 1 × 6 · Failure", "3 × 8–10 · RIR 2".
 * `name` is the group's role, passed only when the prescription has several.
 */
export const setGroupLine = (g: SetGroup, name: string | null, t: TFunction): string =>
  [name, `${g.sets} × ${repsRange(g)}`, groupIntensity(g, t)].filter(Boolean).join(' · ');

/** "4 weeks · RM test week 4": a phase's length, and its test week when it has one. */
export const phaseMeta = (
  routine: { durationWeeks: number; rmTestWeek: number | null },
  t: TFunction,
): string =>
  [
    t('training.weeks', { count: routine.durationWeeks }),
    routine.rmTestWeek ? t('program.rmTestWeek', { n: routine.rmTestWeek }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

/** "Monday" — the day a split is planned on, or null while it has none. Days
 * only: a time an older build stored is not part of the plan any more. */
export const scheduleLabel = (day: { weekday: number | null }, t: TFunction): string | null =>
  day.weekday != null ? t(WEEKDAY_KEY[day.weekday]) : null;
