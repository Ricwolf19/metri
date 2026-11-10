import { describe, expect, it } from 'vitest';

import { wheelStep } from './wheel-step';

describe('wheelStep', () => {
  const minutes = [0, 5, 10, 15];

  it('moves one row either way', () => {
    expect(wheelStep(minutes, 5, 1)).toBe(10);
    expect(wheelStep(minutes, 5, -1)).toBe(0);
  });

  it('stops at the ends instead of wrapping', () => {
    expect(wheelStep(minutes, 15, 1)).toBe(15);
    expect(wheelStep(minutes, 0, -1)).toBe(0);
  });

  it('starts an unknown value from the first row, as the wheel draws it', () => {
    expect(wheelStep(minutes, 7, 1)).toBe(5);
  });

  it('leaves an empty wheel alone', () => {
    expect(wheelStep([], 3, 1)).toBe(3);
  });
});
