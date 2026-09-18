import { describe, expect, it } from 'vitest';

import { formatDate, formatDateKey, formatDayMonth } from './date-format';

const D = new Date(2026, 8, 16); // 16 Sep 2026 (Wednesday)

describe('formatDate', () => {
  it.each([
    ['dmy', '16/09/2026'],
    ['mdy', '09/16/2026'],
    ['ymd', '2026-09-16'],
  ] as const)('%s is locale-independent', (format, expected) => {
    expect(formatDate(D, format, 'en')).toBe(expected);
    expect(formatDate(D, format, 'es')).toBe(expected);
  });

  it('localizes month names for the short and full presets', () => {
    expect(formatDate(D, 'dmmmy', 'en')).toMatch(/Sep.*2026/);
    expect(formatDate(D, 'dmmmy', 'es')).toMatch(/sep.*2026/i);
    expect(formatDate(D, 'full', 'en')).toMatch(/Wednesday.*September.*2026/);
    expect(formatDate(D, 'full', 'es')).toMatch(/miércoles.*septiembre.*2026/i);
  });

  it('formats a storage key without timezone drift', () => {
    expect(formatDateKey('2026-09-16', 'ymd', 'en')).toBe('2026-09-16');
    expect(formatDateKey('2026-01-01', 'dmy', 'en')).toBe('01/01/2026');
  });

  it('keeps the day/month order in the compact form', () => {
    expect(formatDayMonth(D, 'dmy', 'en')).toBe('16/09');
    expect(formatDayMonth(D, 'mdy', 'en')).toBe('09/16');
    expect(formatDayMonth(D, 'dmmmy', 'en')).toMatch(/Sep/);
  });
});
