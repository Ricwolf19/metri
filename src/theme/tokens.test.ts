import { describe, expect, it } from 'vitest';

import { TEXT_SELECTION, THEME_VARS, tokenHex, tokenRgba } from './tokens';

type Rgb = [number, number, number];

const rgbOf = (token: string): Rgb => THEME_VARS[token].split(' ').map(Number) as Rgb;

const parseRgba = (css: string): { rgb: Rgb; alpha: number } => {
  const [r, g, b, a] = css
    .replace(/^rgba\(|\)$/g, '')
    .split(',')
    .map(Number);
  return { rgb: [r, g, b], alpha: a };
};

/** WCAG 2.x relative luminance. */
const luminance = ([r, g, b]: Rgb): number => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** A translucent colour composited over an opaque surface. */
const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb =>
  fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as Rgb;

describe('text selection', () => {
  it('keeps selected ink-50 text readable over the highlight (≥ 4.5:1)', () => {
    const { rgb, alpha } = parseRgba(TEXT_SELECTION.highlight);
    for (const surface of ['--ink-900', '--ink-850', '--ink-800']) {
      const highlight = over(rgb, alpha, rgbOf(surface));
      expect(contrast(rgbOf('--ink-50'), highlight)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('is translucent brand with an opaque brand caret', () => {
    const { rgb, alpha } = parseRgba(TEXT_SELECTION.highlight);
    expect(rgb).toEqual(rgbOf('--brand'));
    expect(alpha).toBeLessThan(1);
    expect(TEXT_SELECTION.caret).toBe('#bef82b');
  });
});

describe('ink text tones', () => {
  it('clears 4.5:1 for ink-400 and ink-500 on the app, sheet and card surfaces', () => {
    for (const text of ['--ink-400', '--ink-500']) {
      for (const surface of ['--ink-900', '--ink-850', '--ink-800']) {
        expect(contrast(rgbOf(text), rgbOf(surface))).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('keeps near-black text readable on the ink-500 "other activity" fill', () => {
    expect(contrast(rgbOf('--brand-contrast'), rgbOf('--ink-500'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('token helpers', () => {
  it('formats hex and rgba from the channel table', () => {
    expect(tokenHex('--ink-900')).toBe('#09090b');
    expect(tokenHex('--brand')).toBe('#bef82b');
    expect(tokenRgba('--brand', 0.13)).toBe('rgba(190,248,43,0.13)');
  });
});
