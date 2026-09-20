import { describe, expect, it } from 'vitest';

import { EXERCISE_CONTENT, EXERCISE_NAMES } from './exercise-content';
import { EXERCISE_SEEDS } from './exercises.seed';
import { HEAD_CATEGORY, MUSCLE_HEADS } from './muscles';

const LOCALES = ['en', 'es'] as const;
const SEED_IDS = EXERCISE_SEEDS.map((e) => e.id);

describe('exercise catalog', () => {
  it('has a unique id per movement', () => {
    expect(new Set(SEED_IDS).size).toBe(SEED_IDS.length);
  });

  it.each(SEED_IDS)('%s names itself in both languages', (id) => {
    const names = EXERCISE_NAMES[id];
    expect(names).toBeDefined();
    for (const locale of LOCALES) expect(names[locale]?.trim().length).toBeGreaterThan(0);
  });

  // The library filters and the body map are driven by muscles, so a seed
  // without them would be unreachable from every chip.
  it.each(SEED_IDS)('%s declares the muscles it trains', (id) => {
    const seed = EXERCISE_SEEDS.find((e) => e.id === id);
    expect(seed?.primaryMuscles.length).toBeGreaterThan(0);
    for (const head of [...(seed?.primaryMuscles ?? []), ...(seed?.secondaryMuscles ?? [])]) {
      expect(MUSCLE_HEADS).toContain(head);
    }
  });

  // Seeds author their own category (both deadlifts sit under `back` even
  // though sumo leads with glutes); only customs derive it. It still has to
  // agree with something the movement actually trains.
  it('files every seed under a category one of its muscles implies', () => {
    for (const seed of EXERCISE_SEEDS) {
      const implied = [...seed.primaryMuscles, ...seed.secondaryMuscles].map(
        (head) => HEAD_CATEGORY[head],
      );
      expect(implied).toContain(seed.category);
    }
  });
});

describe('exercise technique content', () => {
  const documented = Object.keys(EXERCISE_CONTENT);

  it('only documents exercises that ship in the catalog', () => {
    for (const id of documented) expect(SEED_IDS).toContain(id);
  });

  it.each(documented)('%s carries the same sections in both languages', (id) => {
    const [en, es] = LOCALES.map((l) => EXERCISE_CONTENT[id][l]);
    expect(en).toBeDefined();
    expect(es).toBeDefined();
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    expect(es.setup?.length ?? 0).toBe(en.setup?.length ?? 0);
    expect(es.execution).toHaveLength(en.execution.length);
    expect(es.mistakes).toHaveLength(en.mistakes.length);
    expect(es.notes?.length ?? 0).toBe(en.notes?.length ?? 0);
  });

  it.each(documented)('%s says something in every bullet', (id) => {
    for (const locale of LOCALES) {
      const content = EXERCISE_CONTENT[id][locale];
      // A guide is worth opening only with a summary and how to do the lift;
      // `mistakes`/`notes` stay optional — some source notes carry neither.
      expect(content.summary.trim().length).toBeGreaterThan(0);
      expect(content.execution.length).toBeGreaterThan(0);
      const bullets = [
        ...(content.setup ?? []),
        ...content.execution,
        ...content.mistakes,
        ...(content.notes ?? []),
      ];
      for (const bullet of bullets) expect(bullet.trim().length).toBeGreaterThan(0);
    }
  });
});
