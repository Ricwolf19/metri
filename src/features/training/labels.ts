import type { Equipment, ExerciseCategory, IntensityType } from '@/db/schema';
import type { Locale, TFunction } from '@/i18n';
import type { TranslationKey } from '@/i18n/en';

import { EXERCISE_NAMES } from './exercise-content';

export const CATEGORY_KEY: Record<ExerciseCategory, TranslationKey> = {
  chest: 'category.chest',
  back: 'category.back',
  legs: 'category.legs',
  shoulders: 'category.shoulders',
  arms: 'category.arms',
  core: 'category.core',
  full_body: 'category.full_body',
  cardio: 'category.cardio',
};

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

/** Unnamed phases render a slug fallback ("phase-2") instead of a stored fake name. */
export const routineDisplayName = (
  routine: { name: string; orderIndex: number },
  t: TFunction,
): string => routine.name.trim() || t('editor.phaseFallback', { n: routine.orderIndex + 1 });

/** Unnamed splits render a slug fallback ("split-1"). */
export const dayDisplayName = (day: { name: string; orderIndex: number }, t: TFunction): string =>
  day.name.trim() || t('editor.splitFallback', { n: day.orderIndex + 1 });
