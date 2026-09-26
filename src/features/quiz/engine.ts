import { QUIZ_AREAS, QUIZ_MAX_LEVEL, type QuizArea } from './areas';
import type { QuizQuestion } from './content';

/**
 * Quiz state machine, pure and UI-free. Each area starts at level 1 (basic);
 * a correct answer clears the level and climbs, a wrong one closes the area.
 * Areas rotate round-robin until all four close — that branching is what makes
 * the per-area radar honest: nobody answers pro questions outside their depth.
 */

export type QuizState = {
  /** Areas still in play, in rotation order. */
  order: QuizArea[];
  /** Index into `order` of the area being asked right now. */
  cursor: number;
  /** Level currently being attempted, per area (1..QUIZ_MAX_LEVEL). */
  current: Record<QuizArea, number>;
  /** Highest level cleared, per area (0 = not even basic). */
  cleared: Record<QuizArea, number>;
};

const zero = (): Record<QuizArea, number> => ({
  nutrition: 0,
  training: 0,
  body: 0,
  fundamentals: 0,
});

export const startQuiz = (): QuizState => ({
  order: [...QUIZ_AREAS],
  cursor: 0,
  current: { ...zero(), nutrition: 1, training: 1, body: 1, fundamentals: 1 },
  cleared: zero(),
});

export const isQuizComplete = (state: QuizState): boolean => state.order.length === 0;

export const currentArea = (state: QuizState): QuizArea | null => state.order[state.cursor] ?? null;

export const currentQuestion = (
  state: QuizState,
  questions: readonly QuizQuestion[],
): QuizQuestion | null => {
  const area = currentArea(state);
  if (!area) return null;
  const level = state.current[area];
  return questions.find((q) => q.area === area && q.level === level) ?? null;
};

/** Apply an answer to the current question; returns the next state. */
export const answerCurrent = (state: QuizState, correct: boolean): QuizState => {
  const area = currentArea(state);
  if (!area) return state;
  const next: QuizState = {
    order: state.order,
    cursor: state.cursor,
    current: { ...state.current },
    cleared: { ...state.cleared },
  };
  if (correct) {
    next.cleared[area] = next.current[area];
    next.current[area] += 1;
    if (next.current[area] > QUIZ_MAX_LEVEL) next.order = next.order.filter((a) => a !== area);
  } else {
    next.order = next.order.filter((a) => a !== area);
  }
  // Round-robin: a closed area drops out and the next one slides into its
  // index; an area still open hands the turn to the one after it.
  const stillOpen = next.order.includes(area);
  const len = next.order.length;
  next.cursor = len ? (stillOpen ? state.cursor + 1 : state.cursor) % len : 0;
  return next;
};

export type AreaScore = { area: QuizArea; cleared: number };

/** Radar input: cleared level (0..QUIZ_MAX_LEVEL) per area, in QUIZ_AREAS order. */
export const quizScores = (state: QuizState): AreaScore[] =>
  QUIZ_AREAS.map((area) => ({ area, cleared: state.cleared[area] }));
