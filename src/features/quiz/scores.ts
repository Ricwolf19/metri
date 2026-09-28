import { parseJson } from '@/lib/safe-json';
import { settings } from '@/lib/storage';

import { QUIZ_AREAS, QUIZ_MAX_LEVEL, toQuizLevel, type QuizArea, type QuizLevel } from './areas';
import type { AreaScore } from './engine';

/** Highest level cleared per area (0..QUIZ_MAX_LEVEL). */
export type QuizScores = Record<QuizArea, QuizLevel>;

/**
 * Stored scores, or null when the quiz was never finished. MMKV outlives app
 * updates, so anything that does not read as a full, in-range score set is
 * treated as absent rather than trusted.
 */
export const parseScores = (raw: string | undefined): QuizScores | null => {
  const value = parseJson<Record<string, unknown> | null>(raw, null);
  if (!value || typeof value !== 'object') return null;
  const scores = {} as QuizScores;
  for (const area of QUIZ_AREAS) {
    const n = value[area];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > QUIZ_MAX_LEVEL) return null;
    scores[area] = toQuizLevel(n);
  }
  return scores;
};

export const loadScores = (): QuizScores | null => parseScores(settings.getQuizScores());

/** The engine's per-area result as the score record the radar draws. */
export const toQuizScores = (scores: AreaScore[]): QuizScores => {
  const record = Object.fromEntries(QUIZ_AREAS.map((area) => [area, 0])) as QuizScores;
  for (const s of scores) record[s.area] = toQuizLevel(s.cleared);
  return record;
};

/** Persist and hand back the same record, so a caller never re-reads MMKV for it. */
export const saveScores = (scores: AreaScore[]): QuizScores => {
  const record = toQuizScores(scores);
  settings.setQuizScores(JSON.stringify(record));
  return record;
};
