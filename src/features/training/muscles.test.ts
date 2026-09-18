import { describe, expect, it } from 'vitest';

import { MUSCLES, MUSCLE_REGIONS, isMuscleSlug, knownMuscles } from './muscles';

describe('knownMuscles', () => {
  it('keeps known slugs in order and drops legacy free text', () => {
    expect(knownMuscles(['chest', 'arms', 'pecho', 'full_body'])).toEqual(['chest', 'full_body']);
  });

  it('treats null and undefined as empty', () => {
    expect(knownMuscles(null)).toEqual([]);
    expect(knownMuscles(undefined)).toEqual([]);
  });
});

describe('vocabulary', () => {
  it('has no overlap between regions and muscles', () => {
    const all = [...MUSCLE_REGIONS, ...MUSCLES];
    expect(new Set(all).size).toBe(all.length);
    expect(all.every(isMuscleSlug)).toBe(true);
  });
});
