import { describe, expect, it } from 'vitest';

import {
  BAND_EFFORT,
  EFFORT_BANDS,
  EFFORT_MODES,
  effortBand,
  effortModeFor,
  effortRequired,
  rirText,
} from './effort-mode';

describe('effortModeFor', () => {
  // Foundations sends a beginner to failure and teaches the terms as it goes;
  // Progression is built on RIR. Preset ids are a contract.
  it('a preset runs on its own default until the lifter picks', () => {
    expect(effortModeFor('metri-foundations', null)).toBe('simple');
    expect(effortModeFor('metri-progression', null)).toBe('rir');
  });

  it("the lifter's pick wins over the preset", () => {
    expect(effortModeFor('metri-foundations', 'rir')).toBe('rir');
    expect(effortModeFor('metri-foundations', 'free')).toBe('free');
    expect(effortModeFor('metri-progression', 'simple')).toBe('simple');
  });

  it('a custom program, or a session with no enrollment, is professional', () => {
    expect(effortModeFor('custom-123', null)).toBe('rir');
    expect(effortModeFor('custom-123', 'free')).toBe('free');
    expect(effortModeFor(null, null)).toBe('rir');
    expect(effortModeFor(undefined, undefined)).toBe('rir');
  });

  // An older or newer build may have synced a value this one does not know.
  it('an unknown stored value reads as no pick', () => {
    expect(effortModeFor('metri-foundations', 'bands')).toBe('simple');
    expect(effortModeFor('custom-123', '')).toBe('rir');
  });

  it('every mode resolves to itself', () => {
    for (const mode of EFFORT_MODES) expect(effortModeFor('metri-foundations', mode)).toBe(mode);
  });
});

describe('effortRequired', () => {
  it('a prescription that measures effort requires it, except in free mode', () => {
    expect(effortRequired('rir', true)).toBe(true);
    expect(effortRequired('simple', true)).toBe(true);
    expect(effortRequired('free', true)).toBe(false);
  });

  it('a prescription that names no effort never requires it', () => {
    for (const mode of EFFORT_MODES) expect(effortRequired(mode, false)).toBe(false);
  });
});

describe('effortBand', () => {
  it.each([
    [{ rir: 0, isFailure: true }, 'failure'],
    [{ rir: 0, isFailure: false }, 'hard'],
    [{ rir: 1 }, 'hard'],
    [{ rir: 2 }, 'hard'],
    [{ rir: 3 }, 'moderate'],
    [{ rir: 4 }, 'moderate'],
    [{ rir: 5 }, 'easy'],
    [{ rir: 8 }, 'easy'],
  ] as const)('%o reads as %s', (set, band) => {
    expect(effortBand(set)).toBe(band);
  });

  it('no effort is no band', () => {
    expect(effortBand({ rir: null, isFailure: false })).toBeNull();
    expect(effortBand({})).toBeNull();
  });

  // What the simple sheet stores must read back as the band that was picked.
  it.each(EFFORT_BANDS)('a %s pick reads back as itself', (band) => {
    const stored = BAND_EFFORT[band];
    expect(effortBand({ rir: stored.rir, isFailure: stored.failure })).toBe(band);
  });

  it('a band stores on the professional columns: failure is rir 0 + the flag', () => {
    expect(BAND_EFFORT.failure).toEqual({ rir: 0, failure: true });
    expect(BAND_EFFORT.hard).toEqual({ rir: 1, failure: false });
    expect(BAND_EFFORT.moderate).toEqual({ rir: 3, failure: false });
    expect(BAND_EFFORT.easy).toEqual({ rir: 5, failure: false });
  });
});

describe('rirText', () => {
  // The row, the past-set mark and the screen reader all name the open end alike.
  it('names a reserve as itself, and anything from the open end on as 5+', () => {
    expect(rirText(0)).toBe('0');
    expect(rirText(4)).toBe('4');
    expect(rirText(5)).toBe('5+');
    expect(rirText(9)).toBe('5+');
  });
});
