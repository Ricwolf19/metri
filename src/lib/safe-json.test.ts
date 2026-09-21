import { describe, expect, it } from 'vitest';

import { parseJson, parseJsonArray } from './safe-json';

describe('parseJson', () => {
  it('returns the stored value when it reads back', () => {
    expect(parseJson('{"enabled":false}', { enabled: true })).toEqual({ enabled: false });
  });

  it('falls back when the key was never written', () => {
    expect(parseJson(undefined, { enabled: true })).toEqual({ enabled: true });
    expect(parseJson('', { enabled: true })).toEqual({ enabled: true });
  });

  // The regression: a corrupt value used to throw inside the reconcile loop and
  // take every scheduled notification with it.
  it('falls back on corrupt JSON instead of throwing', () => {
    expect(parseJson('{"enabled":', { enabled: true })).toEqual({ enabled: true });
    expect(parseJson('not json at all', { enabled: true })).toEqual({ enabled: true });
  });

  it('treats a stored null as absent', () => {
    expect(parseJson('null', { enabled: true })).toEqual({ enabled: true });
  });
});

describe('parseJsonArray', () => {
  it('returns the stored list', () => {
    expect(parseJsonArray('["a","b"]', [])).toEqual(['a', 'b']);
  });

  it('rejects a value of the wrong shape', () => {
    expect(parseJsonArray('{"a":1}', ['fallback'])).toEqual(['fallback']);
    expect(parseJsonArray('42', ['fallback'])).toEqual(['fallback']);
  });

  it('falls back on corrupt JSON and on an unwritten key', () => {
    expect(parseJsonArray('["a",', ['fallback'])).toEqual(['fallback']);
    expect(parseJsonArray(undefined, ['fallback'])).toEqual(['fallback']);
  });
});
