import { describe, expect, it } from 'vitest';

import { MAP_OUTLINE, fatigueFill, recencyFill } from './muscle-colors';

const channel = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const luminance = ([r, g, b]: number[]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
/** `#rrggbbaa` composited over a surface. */
const over = (fill: string, surface: number[]): number[] => {
  const alpha = fill.length === 9 ? parseInt(fill.slice(7, 9), 16) / 255 : 1;
  return rgb(fill).map((c, i) => alpha * c + (1 - alpha) * surface[i]);
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// The lightest card the map sits on (ink-800).
const CARD = [18, 18, 21];
const theme = { brand: '#bef82b' };

describe('body map colours', () => {
  it('draws the outline and the faintest tint of each ramp at ≥ 3:1 on the card', () => {
    expect(contrast(rgb(MAP_OUTLINE), CARD)).toBeGreaterThanOrEqual(3);
    expect(contrast(over(fatigueFill(theme, 0.01), CARD), CARD)).toBeGreaterThanOrEqual(3);
    expect(contrast(over(recencyFill(theme, 13), CARD), CARD)).toBeGreaterThanOrEqual(3);
  });
});
