import { describe, expect, it, vi } from 'vitest';

import { parseScores, toQuizScores } from './scores';

vi.mock('@/lib/storage', () => ({ settings: {} }));

describe('parseScores', () => {
  it('reads a complete, in-range score set', () => {
    const raw = JSON.stringify({ nutrition: 2, training: 4, body: 0, fundamentals: 1 });
    expect(parseScores(raw)).toEqual({ nutrition: 2, training: 4, body: 0, fundamentals: 1 });
  });

  it('treats a missing or corrupt value as never taken', () => {
    expect(parseScores(undefined)).toBeNull();
    expect(parseScores('{not json')).toBeNull();
    expect(parseScores('[]')).toBeNull();
  });

  it('rejects a set missing an area (an older shape) or out of range', () => {
    expect(parseScores(JSON.stringify({ nutrition: 2, training: 1, body: 0 }))).toBeNull();
    expect(
      parseScores(JSON.stringify({ nutrition: 9, training: 1, body: 0, fundamentals: 0 })),
    ).toBeNull();
  });
});

describe('toQuizScores', () => {
  it('builds the full record straight from the engine result', () => {
    expect(
      toQuizScores([
        { area: 'nutrition', cleared: 2 },
        { area: 'training', cleared: 4 },
        { area: 'body', cleared: 0 },
        { area: 'fundamentals', cleared: 1 },
      ]),
    ).toEqual({ nutrition: 2, training: 4, body: 0, fundamentals: 1 });
  });

  it('fills a missing area with 0 and clamps an out-of-range level', () => {
    expect(toQuizScores([{ area: 'training', cleared: 9 }])).toEqual({
      nutrition: 0,
      training: 4,
      body: 0,
      fundamentals: 0,
    });
  });
});
