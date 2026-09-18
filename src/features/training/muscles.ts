import type { TranslationKey } from '@/i18n/en';

/**
 * Preset focus tags for a split. Stored as slugs in `workout_days.focus_muscles`
 * and translated at render time, so switching language re-labels saved data.
 * Regions cover whole-body sessions; muscles are the usual groups.
 */
export const MUSCLE_REGIONS = ['full_body', 'upper_body', 'lower_body'] as const;
export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'traps',
] as const;

export type MuscleSlug = (typeof MUSCLE_REGIONS)[number] | (typeof MUSCLES)[number];

const ALL: readonly string[] = [...MUSCLE_REGIONS, ...MUSCLES];

export const isMuscleSlug = (value: string): value is MuscleSlug => ALL.includes(value);

export const muscleKey = (slug: MuscleSlug): TranslationKey => `muscle.${slug}`;

/**
 * The known slugs of a stored list, in stored order. Legacy free-text values
 * ("pecho", "arms") are ignored here and dropped on the next explicit save.
 */
export const knownMuscles = (stored: readonly string[] | null | undefined): MuscleSlug[] =>
  (stored ?? []).filter(isMuscleSlug);
