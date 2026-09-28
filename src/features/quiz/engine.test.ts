import { describe, expect, it } from 'vitest';

import { QUIZ_AREAS, QUIZ_MAX_LEVEL } from './areas';
import { QUIZ_QUESTIONS } from './content';
import {
  answerCurrent,
  currentArea,
  currentQuestion,
  isQuizComplete,
  quizScores,
  startQuiz,
} from './engine';

describe('quiz engine', () => {
  it('has exactly one question per area and level', () => {
    for (const area of QUIZ_AREAS) {
      for (let level = 1; level <= QUIZ_MAX_LEVEL; level++) {
        expect(QUIZ_QUESTIONS.filter((q) => q.area === area && q.level === level)).toHaveLength(1);
      }
    }
  });

  it('every question has 4 options and a valid answer index', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.prompt.en.length).toBeGreaterThan(0);
      expect(q.prompt.es.length).toBeGreaterThan(0);
      // The reveal card teaches from this; an empty one would show a bare answer.
      expect(q.why.en.length).toBeGreaterThan(0);
      expect(q.why.es.length).toBeGreaterThan(0);
    }
  });

  it('a correct answer climbs the same area; rotation then moves on', () => {
    let s = startQuiz();
    expect(currentArea(s)).toBe('nutrition');
    s = answerCurrent(s, true);
    expect(s.cleared.nutrition).toBe(1);
    expect(s.current.nutrition).toBe(2);
    expect(currentArea(s)).toBe('training'); // round-robin
    expect(currentQuestion(s, QUIZ_QUESTIONS)?.area).toBe('training');
  });

  it('a wrong answer closes the area at its highest cleared level', () => {
    let s = startQuiz();
    s = answerCurrent(s, true); // nutrition level 1 cleared
    s = answerCurrent(s, false); // training closes at 0
    expect(s.order).not.toContain('training');
    expect(s.cleared.training).toBe(0);
  });

  it('clears the area once it passes the max level', () => {
    let s = startQuiz();
    s = answerCurrent(s, true); // nutrition 1
    s = answerCurrent(s, true); // training 1
    s = answerCurrent(s, true); // body 1
    s = answerCurrent(s, true); // fundamentals 1
    s = answerCurrent(s, true); // nutrition 2
    s = answerCurrent(s, true); // training 2
    s = answerCurrent(s, true); // body 2
    s = answerCurrent(s, true); // fundamentals 2
    s = answerCurrent(s, true); // nutrition 3
    s = answerCurrent(s, true); // training 3
    s = answerCurrent(s, true); // body 3
    s = answerCurrent(s, true); // fundamentals 3
    s = answerCurrent(s, true); // nutrition 4 → cleared
    expect(s.order).not.toContain('nutrition');
    expect(s.cleared.nutrition).toBe(QUIZ_MAX_LEVEL);
  });

  it('completes when every area closed and reports per-area scores', () => {
    let s = startQuiz();
    let guard = 0;
    while (!isQuizComplete(s) && guard++ < 100) {
      s = answerCurrent(s, s.current[currentArea(s)!] % 2 === 1);
    }
    expect(isQuizComplete(s)).toBe(true);
    expect(quizScores(s)).toHaveLength(QUIZ_AREAS.length);
    for (const { cleared } of quizScores(s)) {
      expect(cleared).toBeGreaterThanOrEqual(0);
      expect(cleared).toBeLessThanOrEqual(QUIZ_MAX_LEVEL);
    }
  });
});
