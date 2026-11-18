import { describe, expect, it } from 'vitest';

import { applyGesture, clampAlign, coverSize, IDENTITY, isIdentity, placement } from './align';

const frame = { width: 300, height: 400 };

describe('coverSize', () => {
  it('covers the frame with the aspect kept', () => {
    expect(coverSize(frame, { width: 1620, height: 2160 }, 1)).toEqual({ width: 300, height: 400 });
    // A landscape photo in a portrait frame: the height fills, the width overflows.
    expect(coverSize(frame, { width: 2000, height: 1000 }, 1)).toEqual({ width: 800, height: 400 });
  });

  it('takes a photo of unknown size as 3:4', () => {
    expect(coverSize(frame, { width: null as unknown as number, height: 0 }, 2)).toEqual({
      width: 600,
      height: 800,
    });
  });
});

describe('clampAlign', () => {
  it('keeps the scale between 1 and 3', () => {
    expect(clampAlign({ scale: 0.4, x: 0, y: 0 }, frame, null).scale).toBe(1);
    expect(clampAlign({ scale: 9, x: 0, y: 0 }, frame, null).scale).toBe(3);
  });

  it('never lets an edge of the frame show', () => {
    // At scale 1 a 3:4 photo exactly covers: no room to move.
    expect(clampAlign({ scale: 1, x: 0.3, y: -0.2 }, frame, null)).toEqual(IDENTITY);
    // At scale 2 it is twice the frame: half a frame of room either way.
    expect(clampAlign({ scale: 2, x: 0.9, y: -0.9 }, frame, null)).toEqual({
      scale: 2,
      x: 0.5,
      y: -0.5,
    });
  });

  it('repairs a stored value that is not a number', () => {
    expect(clampAlign({ scale: Number.NaN, x: Number.NaN, y: 0 }, frame, null)).toEqual(IDENTITY);
  });
});

describe('applyGesture', () => {
  it('multiplies the scale and moves the centre by the pan, clamped', () => {
    const next = applyGesture(
      { scale: 1.5, x: 0, y: 0 },
      { scale: 2, dx: 30, dy: -40 },
      frame,
      null,
    );
    expect(next).toEqual({ scale: 3, x: 0.1, y: -0.1 });
    expect(applyGesture(IDENTITY, { scale: 1, dx: 500, dy: 0 }, frame, null)).toEqual(IDENTITY);
  });
});

describe('placement', () => {
  it('centres the drawn photo, offset by the transform', () => {
    expect(placement({ scale: 2, x: 0.1, y: 0 }, frame, null)).toEqual({
      left: -150 + 30,
      top: -200,
      width: 600,
      height: 800,
    });
    expect(placement(null, frame, null)).toEqual({ left: 0, top: 0, width: 300, height: 400 });
  });
});

describe('isIdentity', () => {
  it('reads a near-home transform as nothing to save', () => {
    expect(isIdentity(null)).toBe(true);
    expect(isIdentity({ scale: 1.001, x: 0.001, y: 0 })).toBe(true);
    expect(isIdentity({ scale: 1.2, x: 0, y: 0 })).toBe(false);
  });
});
