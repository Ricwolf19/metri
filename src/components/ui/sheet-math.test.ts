import { describe, expect, it } from 'vitest';

import { FIT_CAP, MIN_LIMIT, computeStops, keyboardLift, keyboardLimit, pct } from './sheet-math';

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
    expect(keyboardLimit(600, 0)).toBe(600);
  });

  it('shrinks the limit by the keyboard height', () => {
    expect(keyboardLimit(600, -300)).toBe(300);
  });

  it('floors at MIN_LIMIT', () => {
    expect(keyboardLimit(300, -300)).toBe(MIN_LIMIT);
    expect(keyboardLimit(100, 0)).toBe(MIN_LIMIT);
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
