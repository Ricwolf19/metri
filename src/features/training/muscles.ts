import type { ExerciseCategory } from '@/db/schema';
import type { TranslationKey } from '@/i18n/en';

// The coarse "focus muscles" vocabulary was retired with the manual split
// picker — a split's muscles now derive from its exercises. Old
// `workout_days.focus_muscles` values stay stored but are never read.

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
 * Last-resort heads for an exercise that names none — legacy customs created
 * before muscles became required. Coarse on purpose: it keeps those movements
 * visible on the body map instead of silently contributing nothing, and any
 * explicit muscle list overrides it.
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

/** Primary heads of an exercise, category fallback for legacy customs. */
export const exerciseHeads = (ex: {
  primaryMuscles: string[] | null;
  category: ExerciseCategory;
}): MuscleHead[] => {
  const primary = knownHeads(ex.primaryMuscles);
  return primary.length ? primary : CATEGORY_HEADS[ex.category];
};

/** Category derived from the first primary head — customs no longer pick one. */
export const HEAD_CATEGORY: Record<MuscleHead, ExerciseCategory> = {
  chest: 'chest',
  upper_chest: 'chest',
  lats: 'back',
  mid_back: 'back',
  lower_back: 'back',
  traps: 'back',
  front_delts: 'shoulders',
  side_delts: 'shoulders',
  rear_delts: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  abs: 'core',
  obliques: 'core',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  adductors: 'legs',
  calves: 'legs',
};
