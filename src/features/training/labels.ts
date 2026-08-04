import type {
  Equipment,
  ExerciseCategory,
  IntensityType,
  ProgramDifficulty,
  ProgramGoal,
} from '@/db/schema';
import type { TranslationKey } from '@/i18n/en';

/** i18n keys for program goal / difficulty enum values. */
export const GOAL_KEY: Record<ProgramGoal, TranslationKey> = {
  strength: 'training.goal.strength',
  hypertrophy: 'training.goal.hypertrophy',
  powerbuilding: 'training.goal.powerbuilding',
  endurance: 'training.goal.endurance',
};

export const DIFFICULTY_KEY: Record<ProgramDifficulty, TranslationKey> = {
  beginner: 'training.diff.beginner',
  intermediate: 'training.diff.intermediate',
  advanced: 'training.diff.advanced',
};

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

/** Monday-first single-letter weekday headers (display-only). */
export const DAY_LETTERS: Record<string, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  es: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
};
