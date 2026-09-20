import { describe, expect, it } from 'vitest';

import { EXERCISE_SEEDS } from './exercises.seed';
import { CATEGORY_HEADS, HEAD_CATEGORY, MUSCLE_HEADS, knownHeads } from './muscles';

describe('vocabulary', () => {
  it('maps every head to a category (custom creation derives it)', () => {
    for (const head of MUSCLE_HEADS) {
      expect(HEAD_CATEGORY[head]).toBeTruthy();
    }
  });
});

describe('knownHeads', () => {
  it('resolves pre-v5 spellings to the canonical head', () => {
    expect(knownHeads(['quadriceps', 'core'])).toEqual(['quads', 'abs']);
  });

  it('drops values that map to nothing', () => {
    expect(knownHeads(['chest', 'pecho', 'arms'])).toEqual(['chest']);
  });

  it('collapses duplicates that alias onto the same head', () => {
    expect(knownHeads(['quads', 'quadriceps'])).toEqual(['quads']);
  });

  it('treats null and undefined as empty', () => {
    expect(knownHeads(null)).toEqual([]);
    expect(knownHeads(undefined)).toEqual([]);
  });
});

describe('catalog ↔ taxonomy', () => {
  // The type system proves every seeded value IS a MuscleHead. It cannot prove
  // the array is non-empty — and an empty one silently degrades the exercise to
  // its category fallback on the body map.
  it('every seeded exercise names at least one primary muscle', () => {
    const bare = EXERCISE_SEEDS.filter((e) => !e.primaryMuscles.length).map((e) => e.id);
    expect(bare).toEqual([]);
  });

  it('no seeded exercise repeats a muscle across primary and secondary', () => {
    const overlapping = EXERCISE_SEEDS.filter((e) =>
      e.secondaryMuscles.some((m) => e.primaryMuscles.includes(m)),
    ).map((e) => e.id);
    expect(overlapping).toEqual([]);
  });

  it('every category has a fallback, so a custom exercise is never invisible', () => {
    for (const heads of Object.values(CATEGORY_HEADS)) {
      expect(heads.every((h) => MUSCLE_HEADS.includes(h))).toBe(true);
    }
    // full_body and cardio are intentionally empty: attributing them to
    // specific heads would invent volume the lifter never did.
    expect(CATEGORY_HEADS.full_body).toEqual([]);
    expect(CATEGORY_HEADS.cardio).toEqual([]);
  });

  it('has no duplicate heads in the vocabulary', () => {
    expect(new Set(MUSCLE_HEADS).size).toBe(MUSCLE_HEADS.length);
  });
});
