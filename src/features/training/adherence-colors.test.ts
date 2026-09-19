import { describe, expect, it } from 'vitest';

import { MISSED, adherenceCell, adherenceDot } from './adherence-colors';

const dark = { scheme: 'dark' as const, brand: '#bef82b', brandContrast: '#08090d' };
const light = { scheme: 'light' as const, brand: '#4d7c0f', brandContrast: '#f7fee7' };

describe('adherence colours', () => {
  it('paints trained as brand with the contrast text', () => {
    expect(adherenceCell(dark, { status: 'trained' })).toEqual({
      fill: '#bef82b',
      text: '#08090d',
    });
  });

  it('paints missed red with near-black text in both schemes', () => {
    for (const theme of [dark, light]) {
      expect(adherenceCell(theme, { status: 'skipped' })).toEqual({
        fill: MISSED,
        text: '#08090d',
      });
    }
  });

  it('keeps today readable without a fill change', () => {
    const today = adherenceCell(dark, { today: true });
    const past = adherenceCell(dark, {});
    expect(today.fill).toBe(past.fill);
    expect(today.text).toBe('#bef82b');
  });

  it('leaves future days bare and unlogged dots transparent', () => {
    expect(adherenceCell(dark, { future: true }).fill).toBe('transparent');
    expect(adherenceDot(dark, undefined)).toBe('transparent');
    expect(adherenceDot(dark, 'skipped')).toBe(MISSED);
  });
});
