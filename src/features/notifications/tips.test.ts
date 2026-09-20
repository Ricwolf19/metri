import { describe, expect, it } from 'vitest';

import { TIP_FREQUENCIES, TIP_SLOTS, tipFor } from './tips';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];
const LOCALES = ['en', 'es'] as const;

describe('tip rotation', () => {
  it.each(TIP_FREQUENCIES)('never repeats a tip in a week at %i per day', (perDay) => {
    const slots = TIP_SLOTS[perDay];
    for (const locale of LOCALES) {
      const titles = slots.flatMap((_, slot) =>
        WEEKDAYS.map((weekday) => tipFor(locale, slot, weekday).title),
      );
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it('returns the same tip for the same slot and weekday', () => {
    expect(tipFor('en', 1, 3)).toEqual(tipFor('en', 1, 3));
  });

  it('gives each locale its own copy', () => {
    expect(tipFor('es', 0, 1).title).not.toBe(tipFor('en', 0, 1).title);
  });

  it('carries a title and a body for every scheduled entry', () => {
    for (const locale of LOCALES) {
      for (const slot of TIP_SLOTS[Math.max(...TIP_FREQUENCIES)].keys()) {
        for (const weekday of WEEKDAYS) {
          const tip = tipFor(locale, slot, weekday);
          expect(tip.title.length).toBeGreaterThan(0);
          expect(tip.body.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('tip slots', () => {
  it('defines one table entry per selectable frequency', () => {
    expect(Object.keys(TIP_SLOTS).map(Number).sort()).toEqual([...TIP_FREQUENCIES].sort());
  });

  it.each(TIP_FREQUENCIES)('spreads %i slots across the waking day', (perDay) => {
    const slots = TIP_SLOTS[perDay];
    expect(slots).toHaveLength(perDay);
    const minutes = slots.map((s) => s.hour * 60 + s.minute);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
    expect(Math.min(...slots.map((s) => s.hour))).toBeGreaterThanOrEqual(7);
    expect(Math.max(...slots.map((s) => s.hour))).toBeLessThanOrEqual(21);
  });
});
