import { describe, expect, it, vi } from 'vitest';

import { parseScores } from './scores';

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
