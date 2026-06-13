import type { ProgramDifficulty, ProgramGoal } from '@/db/schema';
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
