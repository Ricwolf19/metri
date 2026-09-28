import type { TranslationKey } from '@/i18n/en';

/** The four knowledge areas the quiz assesses. Ids are persisted — never rename. */
export type QuizArea = 'nutrition' | 'training' | 'body' | 'fundamentals';

export const QUIZ_AREAS: QuizArea[] = ['nutrition', 'training', 'body', 'fundamentals'];

/** basic (1) → pro (4). A wrong answer closes the area at its highest cleared level. */
export const QUIZ_MAX_LEVEL = 4;

/** Cleared level: 0 (not even basic) … QUIZ_MAX_LEVEL. */
export type QuizLevel = 0 | 1 | 2 | 3 | 4;

/** Clamp a counted level into range — the engine counts in plain numbers. */
export const toQuizLevel = (n: number): QuizLevel =>
  Math.min(Math.max(Math.round(n), 0), QUIZ_MAX_LEVEL) as QuizLevel;

export const AREA_KEY: Record<QuizArea, TranslationKey> = {
  nutrition: 'quiz.area.nutrition',
  training: 'quiz.area.training',
  body: 'quiz.area.body',
  fundamentals: 'quiz.area.fundamentals',
};

export const LEVEL_KEY: Record<QuizLevel, TranslationKey> = {
  0: 'quiz.level0',
  1: 'quiz.level1',
  2: 'quiz.level2',
  3: 'quiz.level3',
  4: 'quiz.level4',
};
