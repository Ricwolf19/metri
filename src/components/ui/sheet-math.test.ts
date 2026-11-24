import { describe, expect, it } from 'vitest';

import {
  FIT_CAP,
  MIN_LIMIT,
  computeStops,
  keyboardCover,
  keyboardLift,
  keyboardLimit,
  pct,
  scrimOpacity,
  sheetSize,
  sheetTranslate,
} from './sheet-math';

const WINDOW = 1000;
const CEILING = 950;

describe('pct', () => {
  it('reads a percentage string as a share', () => {
    expect(pct('55%')).toBe(0.55);
  });

  it('clamps to 0.2–1', () => {
    expect(pct('5%')).toBe(0.2);
    expect(pct('140%')).toBe(1);
  });
});

describe('computeStops', () => {
  it('dedupes and sorts explicit stops', () => {
    const b = computeStops(['92%', '50%', '50%'], WINDOW, true, true, CEILING);
    expect(b.stops).toEqual([500, 920]);
    expect(b.min).toBe(500);
    expect(b.max).toBe(920);
  });

  it('caps every stop at the ceiling', () => {
    const b = computeStops(['50%', '100%'], WINDOW, true, true, CEILING);
    expect(b.stops).toEqual([500, CEILING]);
    expect(b.max).toBe(CEILING);
  });

  it('offers a single stop when not expandable', () => {
    const b = computeStops(['50%', '92%'], WINDOW, false, true, CEILING);
    expect(b).toEqual({ min: 500, max: 500, stops: [500] });
  });

  it('offers a single stop until the content overflows the first one', () => {
    const b = computeStops(['50%', '92%'], WINDOW, true, false, CEILING);
    expect(b).toEqual({ min: 500, max: 500, stops: [500] });
  });

  it('defaults to the fit cap of the window', () => {
    const b = computeStops(undefined, WINDOW, true, true, CEILING);
    expect(b).toEqual({ min: WINDOW * FIT_CAP, max: WINDOW * FIT_CAP, stops: [WINDOW * FIT_CAP] });
  });
});

describe('keyboardLimit', () => {
  it('leaves the limit alone with the keyboard closed', () => {
    expect(keyboardLimit(600, 0, CEILING)).toBe(600);
  });

  it('keeps a shorter sheet whole while it fits between the keyboard and the ceiling', () => {
    // The spotlight's 60 %: it used to drop to 300 here, with 350 free above it.
    expect(keyboardLimit(600, -300, CEILING)).toBe(600);
  });

  it('shrinks a tall sheet to the room left above the keyboard', () => {
    expect(keyboardLimit(920, -300, CEILING)).toBe(CEILING - 300);
  });

  it('floors at MIN_LIMIT', () => {
    expect(keyboardLimit(600, -850, CEILING)).toBe(MIN_LIMIT);
    expect(keyboardLimit(100, 0, CEILING)).toBe(MIN_LIMIT);
  });
});

describe('sheetSize', () => {
  it('only caps a content sheet, so it hugs what it holds', () => {
    expect(sheetSize(920, 0, CEILING, false)).toEqual({ maxHeight: 920 });
  });

  // The session's "add exercise" sheet hosts a FlashList, which has no height
  // of its own: capped only, it opened as its title and search, no list at all.
  it('gives a fill sheet its whole cap as its height', () => {
    expect(sheetSize(920, 0, CEILING, true)).toEqual({ maxHeight: 920, height: 920 });
  });

  it('shrinks a fill sheet to the room the keyboard leaves', () => {
    expect(sheetSize(920, -300, CEILING, true)).toEqual({
      maxHeight: CEILING - 300,
      height: CEILING - 300,
    });
    expect(sheetSize(920, -850, CEILING, true).height).toBe(MIN_LIMIT);
  });
});

describe('keyboardCover', () => {
  it('covers none of the bottom inset with the keyboard down, all of it once up', () => {
    expect(keyboardCover(34, 0)).toBe(0);
    expect(keyboardCover(34, 1)).toBe(34);
    expect(keyboardCover(34, 0.5)).toBe(17);
  });

  it('is exactly the inset the lift tucks behind the keyboard', () => {
    // The sheet's bottom sits this far under the keyboard's edge: a list that
    // runs to the sheet's bottom keeps its fade that far up.
    const kb = -300;
    expect(keyboardLift(0, kb, 34, 0.5) - kb).toBe(keyboardCover(34, 0.5));
  });
});

describe('keyboardLift', () => {
  it('is the offset alone with the keyboard closed', () => {
    expect(keyboardLift(120, 0, 34, 0)).toBe(120);
  });

  it('lifts by the keyboard height and cancels the bottom inset when fully open', () => {
    expect(keyboardLift(120, -300, 34, 1)).toBe(120 - 300 + 34);
  });

  it('scales the inset term with progress mid-flight', () => {
    expect(keyboardLift(0, -150, 40, 0.5)).toBe(-130);
  });
});

describe('sheetTranslate', () => {
  it('rests closed a full cap below the edge and open at zero', () => {
    expect(sheetTranslate(0, 920, 0)).toBe(920);
    expect(sheetTranslate(1, 920, 0)).toBe(0);
  });

  it('adds the pull of a drag on top of the slide', () => {
    expect(sheetTranslate(1, 920, 80)).toBe(80);
    expect(sheetTranslate(0.5, 920, 80)).toBe(540);
  });
});

describe('scrimOpacity', () => {
  it('follows the rise alone: the measured height arriving mid-rise never moves it', () => {
    // Before layout the height is unknown (0); a frame later it is the content's.
    expect(scrimOpacity(0.3, 0, 0, 0.6)).toBeCloseTo(0.18);
    expect(scrimOpacity(0.3, 0, 300, 0.6)).toBeCloseTo(0.18);
    expect(scrimOpacity(0, 0, 300, 0.6)).toBe(0);
    expect(scrimOpacity(1, 0, 300, 0.6)).toBeCloseTo(0.6);
  });

  it('clears as a drag pulls the open sheet away', () => {
    expect(scrimOpacity(1, 150, 300, 0.6)).toBeCloseTo(0.3);
    expect(scrimOpacity(1, 600, 300, 0.6)).toBe(0);
  });
});
