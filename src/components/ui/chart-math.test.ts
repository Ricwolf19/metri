import { describe, expect, it } from 'vitest';

import {
  axisValues,
  seriesKey,
  labelStride,
  nearestIndex,
  paddedDomain,
  seriesExtent,
  showsLabel,
  xDomain,
} from './chart-math';

describe('paddedDomain', () => {
  it('pads the span on both sides', () => {
    expect(paddedDomain([80, 90], 0.1)).toEqual([79, 91]);
  });

  // A single weigh-in used to divide by a zero span and draw nothing.
  it('gives a flat series a span so it sits mid-plot', () => {
    const [lo, hi] = paddedDomain([82, 82], 0.5);
    expect(lo).toBeLessThan(82);
    expect(hi).toBeGreaterThan(82);
    expect((lo + hi) / 2).toBeCloseTo(82);
  });

  it('is a unit range with nothing to show', () => {
    expect(paddedDomain([])).toEqual([0, 1]);
  });
});

describe('xDomain', () => {
  it('spans the positions', () => {
    expect(xDomain([3, 0, 9])).toEqual([0, 9]);
  });

  it('centres a single position', () => {
    expect(xDomain([5])).toEqual([4, 6]);
  });
});

describe('nearestIndex', () => {
  it('picks the closest position', () => {
    expect(nearestIndex([10, 50, 90], 64)).toBe(1);
    expect(nearestIndex([10, 50, 90], 200)).toBe(2);
  });

  it('keeps the first of two equally close', () => {
    expect(nearestIndex([10, 30], 20)).toBe(0);
  });

  it('is -1 with nothing to pick', () => {
    expect(nearestIndex([], 20)).toBe(-1);
  });
});

describe('labelStride / showsLabel', () => {
  it('prints every label when they fit', () => {
    expect(labelStride(6, 300, 44)).toBe(1);
  });

  // Twelve labels on a 320dp phone overlapped into one smudge.
  it('thins labels that would overlap', () => {
    expect(labelStride(12, 280, 44)).toBe(2);
  });

  it('always prints the last bar and counts back from it', () => {
    const shown = Array.from({ length: 7 }, (_, i) => showsLabel(i, 7, 3));
    expect(shown).toEqual([true, false, false, true, false, false, true]);
  });
});

describe('seriesExtent', () => {
  it('reads first, last, min and max', () => {
    expect(seriesExtent([3, 1, 5, 4])).toEqual({ first: 3, last: 4, min: 1, max: 5 });
  });

  it('is null for an empty series', () => {
    expect(seriesExtent([])).toBeNull();
  });
});

describe('axisValues', () => {
  it('orders top, middle, bottom whatever the domain direction', () => {
    expect(axisValues([90, 70])).toEqual([90, 80, 70]);
    expect(axisValues([70, 90])).toEqual([90, 80, 70]);
  });
});

describe('seriesKey', () => {
  it('tells new values on the same bars apart, so a pick does not carry over', () => {
    expect(seriesKey([0, 1, 2], [10, 20, 30])).toBe(seriesKey([0, 1, 2], [10, 20, 30]));
    expect(seriesKey([0, 1, 2], [10, 20, 30])).not.toBe(seriesKey([0, 1, 2], [10, 20, 31]));
    expect(seriesKey([0, 1, 2], [10, 20, 30])).not.toBe(seriesKey([1, 2, 3], [10, 20, 30]));
  });
});
