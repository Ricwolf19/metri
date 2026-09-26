/** The four knowledge areas the quiz assesses. Ids are persisted — never rename. */
export type QuizArea = 'nutrition' | 'training' | 'body' | 'fundamentals';

export const QUIZ_AREAS: QuizArea[] = ['nutrition', 'training', 'body', 'fundamentals'];

/** basic (1) → pro (4). A wrong answer closes the area at its highest cleared level. */
export const QUIZ_MAX_LEVEL = 4;
