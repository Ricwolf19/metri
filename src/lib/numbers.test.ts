import { describe, expect, it } from 'vitest';

import { formatNumber, parseDecimal, parseInteger, roundHalf, snapTo, trimFloat } from './numbers';

describe('parseDecimal', () => {
  it('accepts a comma as the decimal separator (Spanish keyboards)', () => {
    expect(parseDecimal('22,5')).toBe(22.5);
    expect(parseDecimal(' 22.5 ')).toBe(22.5);
  });

  it('rejects empty, non-numeric and negative input', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('  ')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('-5')).toBeNull();
    expect(parseDecimal('Infinity')).toBeNull();
  });

  it('accepts zero (an empty bar)', () => {
    expect(parseDecimal('0')).toBe(0);
  });
});

describe('parseInteger', () => {
  it('accepts whole reps and rejects fractions instead of truncating', () => {
    expect(parseInteger('8')).toBe(8);
    expect(parseInteger('8.5')).toBeNull();
    expect(parseInteger('8,0')).toBe(8);
  });
});

describe('snapTo / roundHalf', () => {
  it('snaps to the nearest step without float noise', () => {
    expect(snapTo(1.3, 0.25)).toBe(1.25);
    expect(snapTo(1.4, 0.25)).toBe(1.5);
    expect(snapTo(0.1 + 0.2, 0.1)).toBe(0.3);
  });

  it('rounds training numbers to the half', () => {
    expect(roundHalf(62.26)).toBe(62.5);
    expect(roundHalf(62.74)).toBe(62.5);
    expect(roundHalf(62.76)).toBe(63);
    expect(roundHalf(62.24)).toBe(62);
  });
});

describe('trimFloat / formatNumber', () => {
  it('removes float artifacts and trailing zeros', () => {
    expect(trimFloat(0.1 + 0.2)).toBe(0.3);
    expect(formatNumber(12.5)).toBe('12.5');
    expect(formatNumber(12.504)).toBe('12.5');
    expect(formatNumber(132.2772, 2)).toBe('132.28');
  });
});
