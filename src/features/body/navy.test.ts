import { describe, expect, it } from 'vitest';

import { navyFromTape } from './navy';
import type { SiteId } from './sites';

type Tape = Partial<Record<SiteId, number>>;

const male = (latestCm: Tape, heightCm: number | null = 178) =>
  navyFromTape({ latestCm, sex: 'male', heightCm });

const female = (latestCm: Tape, heightCm: number | null = 165) =>
  navyFromTape({ latestCm, sex: 'female', heightCm });

describe('navyFromTape — required sites', () => {
  it('needs neck and waist for a male', () => {
    expect(male({})).toEqual({ missing: ['neck', 'waist'] });
    expect(male({ neck: 38 })).toEqual({ missing: ['waist'] });
    expect(male({ waist: 85 })).toEqual({ missing: ['neck'] });
  });

  it('needs hips on top of neck and waist for a female', () => {
    expect(female({})).toEqual({ missing: ['neck', 'waist', 'hips'] });
    expect(female({ neck: 32, waist: 72 })).toEqual({ missing: ['hips'] });
  });

  it('does not ask a male for hips, and ignores them when present', () => {
    expect(male({ neck: 38, waist: 85 })).toEqual({ pct: 16.4 });
    expect(male({ neck: 38, waist: 85, hips: 99 })).toEqual({ pct: 16.4 });
  });

  it('reports the missing sites instead of a percentage', () => {
    const result = female({ waist: 72, hips: 96 });
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('pct');
    expect(result).toEqual({ missing: ['neck'] });
  });

  it('treats a zero reading as missing — 0 cm is never a measurement', () => {
    expect(male({ neck: 0, waist: 85 })).toEqual({ missing: ['neck'] });
  });

  it('lists missing sites in the formula order, not the order they were taken', () => {
    expect(female({ hips: 96 })).toEqual({ missing: ['neck', 'waist'] });
  });
});

describe('navyFromTape — identity gates', () => {
  it('returns null without a sex: the formula has two different branches', () => {
    expect(
      navyFromTape({ latestCm: { neck: 38, waist: 85 }, sex: null, heightCm: 178 }),
    ).toBeNull();
  });

  it('returns null without a height', () => {
    expect(male({ neck: 38, waist: 85 }, null)).toBeNull();
  });

  it('treats a zero height as absent rather than dividing by it', () => {
    expect(male({ neck: 38, waist: 85 }, 0)).toBeNull();
  });
});

describe('navyFromTape — known tape sets', () => {
  // 495 / (1.0324 − 0.19077·log10(waist − neck) + 0.15456·log10(height)) − 450,
  // rounded to one decimal by the shared `round` helper.
  it('computes the male percentage', () => {
    expect(male({ neck: 38, waist: 85 })).toEqual({ pct: 16.4 });
    expect(male({ neck: 38, waist: 95 })).toEqual({ pct: 23.6 });
  });

  // 495 / (1.29579 − 0.35004·log10(waist + hip − neck) + 0.221·log10(height)) − 450.
  it('computes the female percentage from waist + hips − neck', () => {
    expect(female({ neck: 32, waist: 72, hips: 96 })).toEqual({ pct: 26.4 });
    expect(female({ neck: 32, waist: 80, hips: 100 })).toEqual({ pct: 32.4 });
  });

  it('rises with the waist, everything else held', () => {
    const lean = male({ neck: 38, waist: 80 });
    const heavier = male({ neck: 38, waist: 95 });
    expect(lean).toHaveProperty('pct');
    expect(heavier).toHaveProperty('pct');
    expect((lean as { pct: number }).pct).toBeLessThan((heavier as { pct: number }).pct);
  });
});

describe('navyFromTape — impossible geometry', () => {
  it('returns null when waist equals neck (log10(0) collapses the formula)', () => {
    expect(male({ neck: 40, waist: 40 })).toBeNull();
  });

  it('returns null when the waist is smaller than the neck (log10 of a negative is NaN)', () => {
    expect(male({ neck: 45, waist: 40 })).toBeNull();
  });

  it('returns null when the waist–neck gap is too small to produce a positive percentage', () => {
    // A 1 cm gap drives the raw value to about −91: non-positive, so no estimate
    // is offered rather than a nonsense one being written to the profile.
    expect(male({ neck: 39, waist: 40 })).toBeNull();
  });

  it('returns null for a female whose waist + hips do not exceed the neck', () => {
    expect(female({ neck: 170, waist: 80, hips: 90 })).toBeNull();
  });
});
