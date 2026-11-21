import { describe, expect, it } from 'vitest';

import { CATALOG_REST_SECONDS } from './catalog-rest';
import { defaultRestFor } from './exercise-rest';
import { EXERCISE_SEEDS } from './exercises.seed';

const exerciseById = new Map(EXERCISE_SEEDS.map((e) => [e.id, e]));

describe('CATALOG_REST_SECONDS', () => {
  it('has exactly one entry per catalog exercise', () => {
    const seedIds = EXERCISE_SEEDS.map((e) => e.id).sort();
    expect(Object.keys(CATALOG_REST_SECONDS).sort()).toEqual(seedIds);
  });

  it('rests in steps of 15 s, between one and four minutes', () => {
    const outOfRange = Object.entries(CATALOG_REST_SECONDS).filter(
      ([, seconds]) => seconds % 15 !== 0 || seconds < 60 || seconds > 240,
    );
    expect(outOfRange).toEqual([]);
  });
});

describe('defaultRestFor', () => {
  it('rests a catalog exercise at its own entry', () => {
    for (const seed of EXERCISE_SEEDS) {
      expect(defaultRestFor(seed)).toBe(CATALOG_REST_SECONDS[seed.id]);
    }
  });

  it('rests a deadlift as a main lift, longer than the back extension it replaced', () => {
    const deadlift = defaultRestFor(exerciseById.get('deadlift')!);
    expect(deadlift).toBeGreaterThan(defaultRestFor(exerciseById.get('back-extension')!));
    expect(deadlift).toBeGreaterThanOrEqual(180);
  });

  it('reads a custom exercise from what it trains', () => {
    const custom = { id: 'custom-1', secondaryMuscles: [] };
    expect(defaultRestFor({ ...custom, category: 'back', primaryMuscles: ['glutes'] })).toBe(180);
    expect(defaultRestFor({ ...custom, category: 'back', primaryMuscles: ['lats'] })).toBe(120);
    expect(
      defaultRestFor({
        ...custom,
        category: 'chest',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps'],
      }),
    ).toBe(180);
    expect(
      defaultRestFor({
        ...custom,
        category: 'arms',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
      }),
    ).toBe(120);
  });
});
