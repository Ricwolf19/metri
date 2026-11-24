import { describe, expect, it } from 'vitest';

import { gridRows, nearestIndex, rowInSight, windowHeight, windowOffset } from './load-grid';

describe('gridRows', () => {
  // 30 loads in rows of five: rows 0–5.
  const count = 30;

  it('does not fold a grid that fits in its rows and the peek', () => {
    expect(gridRows(15, 0)).toBeNull();
    expect(gridRows(16, 0)).not.toBeNull();
  });

  it('opens on the first rows with nothing picked', () => {
    expect(gridRows(count, 0)).toEqual({ from: 0, to: 2 });
  });

  it('keeps the pick in view with the loads either side of it', () => {
    // Mid-row: its own row first, two lighter loads beside it.
    expect(gridRows(count, 12)).toEqual({ from: 2, to: 4 });
    // Opening a row: the row before comes too, so the lighter ones stay in reach.
    expect(gridRows(count, 10)).toEqual({ from: 1, to: 3 });
    expect(gridRows(count, 11)).toEqual({ from: 1, to: 3 });
    expect(gridRows(count, 14)).toEqual({ from: 2, to: 4 });
  });

  it('slides in at the ends so the rows stay full', () => {
    expect(gridRows(count, 1)).toEqual({ from: 0, to: 2 });
    expect(gridRows(count, 29)).toEqual({ from: 4, to: 6 });
    expect(gridRows(count, 24)).toEqual({ from: 4, to: 6 });
  });

  it('always holds the anchor in its rows, wherever it sits', () => {
    for (let anchor = 0; anchor < count; anchor++) {
      const rows = gridRows(count, anchor)!;
      const row = Math.floor(anchor / 5);
      expect(row >= rows.from && row < rows.to).toBe(true);
    }
  });
});

describe('the folded window', () => {
  const rhythm = { rowHeight: 44, gap: 7 };

  it('holds two rows whole and half a row either side', () => {
    // 22 + 7 | 44 + 7 + 44 | 7 + 22: three rows and three gaps.
    expect(windowHeight(rhythm)).toBe(153);
  });

  it('opens with half the row before peeking in above, none above the first', () => {
    expect(windowOffset({ from: 0, to: 2 }, rhythm)).toBe(0);
    // Row 2 starts at 102: half of row 1 and its gap show above it.
    expect(windowOffset({ from: 2, to: 4 }, rhythm)).toBe(102 - 22 - 7);
  });

  it('puts the rows it opens on whole in sight', () => {
    const offset = windowOffset({ from: 2, to: 4 }, rhythm);
    const sight = windowHeight(rhythm);
    expect(rowInSight(2, offset, sight, rhythm)).toBe(true);
    expect(rowInSight(3, offset, sight, rhythm)).toBe(true);
  });

  it('counts a row peeking in as in sight, and one past the edge as not', () => {
    // Scrolled to the top: row 2 (102–146) is in sight, row 3 (153–197) is out.
    expect(rowInSight(2, 0, 153, rhythm)).toBe(true);
    expect(rowInSight(3, 0, 153, rhythm)).toBe(false);
    // Scrolled 30 down, row 3 peeks in at the bottom edge.
    expect(rowInSight(3, 30, 153, rhythm)).toBe(true);
    // Scrolled past row 0 (0–44): it is out above.
    expect(rowInSight(0, 60, 153, rhythm)).toBe(false);
  });
});

describe('nearestIndex', () => {
  it('finds the load closest to a number no load matches', () => {
    expect(nearestIndex([2.5, 5, 7.5, 10], 6)).toBe(1);
    expect(nearestIndex([2.5, 5, 7.5, 10], 99)).toBe(3);
    expect(nearestIndex([2.5, 5], null)).toBeNull();
    expect(nearestIndex([], 5)).toBeNull();
  });
});
