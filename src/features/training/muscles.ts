import type { ExerciseCategory } from '@/db/schema';
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

/* ── Anatomical heads: the vocabulary of `exercises.primary/secondaryMuscles` ──
 *
 * Deliberately FINER than `MUSCLES` above — collapsing the three deltoid heads
 * (or lats vs mid-back) would make the balance view unable to show the
 * imbalances it exists to show.
 * @see AGENTS.md#analytics
 */
export const MUSCLE_HEADS = [
  'chest',
  'upper_chest',
  'lats',
  'mid_back',
  'lower_back',
  'traps',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
] as const;

export type MuscleHead = (typeof MUSCLE_HEADS)[number];

const HEADS: readonly string[] = MUSCLE_HEADS;

const isMuscleHead = (value: string): value is MuscleHead => HEADS.includes(value);

/** Heads share the `muscle.*` namespace with the coarse slugs they overlap. */
export const muscleHeadKey = (head: MuscleHead): TranslationKey => `muscle.${head}`;

/** Pre-v5 catalog spellings. Seeded rows are rewritten by the seed bump; this
 * keeps any row that escaped it (or an imported file) from silently vanishing. */
const HEAD_ALIASES: Record<string, MuscleHead> = {
  quadriceps: 'quads',
  core: 'abs',
  hamstring: 'hamstrings',
  glute: 'glutes',
  forearm: 'forearms',
};

const normalizeHead = (value: string): MuscleHead | null =>
  isMuscleHead(value) ? value : (HEAD_ALIASES[value] ?? null);

/** Known heads of a stored list, aliases resolved, duplicates collapsed. */
export const knownHeads = (stored: readonly string[] | null | undefined): MuscleHead[] => {
  const out: MuscleHead[] = [];
  for (const raw of stored ?? []) {
    const head = normalizeHead(raw);
    if (head && !out.includes(head)) out.push(head);
  }
  return out;
};

/**
 * Last-resort heads for an exercise that names none — every custom exercise,
 * since the picker only asks for a category. Coarse on purpose: it keeps a
 * user's own movements visible on the body map instead of silently
 * contributing nothing, and any explicit muscle list overrides it.
 */
export const CATEGORY_HEADS: Record<ExerciseCategory, MuscleHead[]> = {
  chest: ['chest'],
  back: ['lats'],
  legs: ['quads', 'glutes'],
  shoulders: ['side_delts'],
  arms: ['biceps', 'triceps'],
  core: ['abs'],
  full_body: [],
  cardio: [],
};
