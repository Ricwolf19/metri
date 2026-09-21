import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { customFoods, foodLogs, syncDeletions, users } from '@/db/schema';
import { createTestDb } from '@/test/sqlite';

import { byMeal, progress, scale, sumTotals, weeklyIntake } from './diary';
import { foodDocs } from './food-docs';
import { FOOD_CATEGORIES, fromCatalog, searchFoods, type Food } from './foods';
import { FOODS } from './foods.data';
import { MEAL_SEEDS, mealById, mealIngredients, mealTotals } from './meals';
import { PLAN_SEEDS, planMeals, planTotals } from './plans';

vi.mock('@/db/client', async () => ({ db: await createTestDb() }));
vi.mock('@/lib/crypto', () => ({ randomId: () => crypto.randomUUID() }));

const { db } = await import('@/db/client');
const repo = await import('./food-log.repo');

const U = 'u-1';
const RICE = { kcal: 365, proteinG: 7.1, carbsG: 80, fatG: 0.7, fiberG: 1.3 };

describe('scale', () => {
  it('scales per-100 g values to the amount eaten', () => {
    expect(scale(RICE, 50)).toEqual({
      kcal: 183,
      proteinG: 3.6,
      carbsG: 40,
      fatG: 0.4,
      fiberG: 0.7,
    });
    expect(scale(RICE, 100)).toEqual({ ...RICE, kcal: 365 });
  });

  it('treats a negative amount as nothing eaten', () => {
    expect(scale(RICE, -20).kcal).toBe(0);
  });
});

describe('sumTotals / byMeal', () => {
  it('adds entries without floating-point drift', () => {
    const t = sumTotals([scale(RICE, 50), scale(RICE, 50), scale(RICE, 33)]);
    expect(t.kcal).toBe(183 + 183 + 120);
    expect(t.proteinG).toBe(Math.round((3.6 + 3.6 + 2.3) * 10) / 10);
  });

  it('is all zeros for an empty day', () => {
    expect(sumTotals([])).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
  });

  it('keeps every meal present, even the empty ones', () => {
    const grouped = byMeal([{ meal: 'lunch' as const, id: 1 }]);
    expect(Object.keys(grouped)).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.dinner).toEqual([]);
  });
});

describe('weeklyIntake', () => {
  const day = (date: string, kcal: number, proteinG = 100) => ({
    date,
    kcal,
    proteinG,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  });

  it('averages over LOGGED days only — an unlogged day is unknown, not zero', () => {
    const w = weeklyIntake(
      [day('2026-09-14', 2000), day('2026-09-14', 500), day('2026-09-16', 3000)],
      '2026-09-14',
      '2026-09-20',
    );
    expect(w).toMatchObject({ avgKcal: 2750, daysLogged: 2 });
  });

  it('ignores entries outside the window', () => {
    const w = weeklyIntake(
      [day('2026-09-01', 9000), day('2026-09-15', 2000)],
      '2026-09-14',
      '2026-09-20',
    );
    expect(w).toMatchObject({ avgKcal: 2000, daysLogged: 1 });
  });

  it('reports nothing rather than zero when no day was logged', () => {
    expect(weeklyIntake([], '2026-09-14', '2026-09-20')).toEqual({
      avgKcal: null,
      avgProteinG: null,
      daysLogged: 0,
    });
  });
});

describe('progress', () => {
  it.each<[number, number | null, number]>([
    [1000, 2000, 0.5],
    [2500, 2000, 1],
    [500, null, 0],
    [500, 0, 0],
  ])('%i of %s → %f', (value, target, expected) => {
    expect(progress(value, target)).toBe(expected);
  });
});

describe('searchFoods', () => {
  const es: Food[] = FOODS.map((f) => fromCatalog(f, 'es'));
  const en: Food[] = FOODS.map((f) => fromCatalog(f, 'en'));

  it('finds accented names from an unaccented query, and the reverse', () => {
    expect(searchFoods(es, 'platano')[0]?.id).toBe('banana');
    expect(searchFoods(es, 'plátano')[0]?.id).toBe('banana');
  });

  it('ranks names starting with the query first', () => {
    const ids = searchFoods(en, 'rice').map((f) => f.id);
    expect(ids).toContain('rice-white-raw');
    expect(ids).toContain('rice-brown-cooked');
  });

  it('requires every word to match', () => {
    const ids = searchFoods(en, 'chicken raw').map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['chicken-breast-raw', 'chicken-thigh-raw']));
    expect(ids).not.toContain('chicken-breast-cooked');
  });

  it('returns nothing for a blank query', () => {
    expect(searchFoods(en, '   ')).toEqual([]);
  });
});

describe('catalogue integrity', () => {
  it('has unique ids — they are written into food_logs', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  });

  it('names every food in both languages', () => {
    expect(FOODS.filter((f) => !f.en.trim() || !f.es.trim()).map((f) => f.id)).toEqual([]);
  });

  it('has calories roughly consistent with its macros', () => {
    // Atwater, with fibre at ~2 kcal/g rather than 4 — it is only partly
    // available, and USDA's own kcal accounts for that. Ignoring it makes
    // high-fibre foods (cinnamon is 53 g/100 g) look wrong when they are not.
    // Alcohol carries 7 kcal/g that no macro column holds, so beer is exempt.
    const off = FOODS.filter((f) => f.id !== 'beer').filter((f) => {
      const available = Math.max(0, f.carbsG - f.fiberG);
      const atwater = f.proteinG * 4 + available * 4 + f.fiberG * 2 + f.fatG * 9;
      return Math.abs(atwater - f.kcal) > Math.max(25, f.kcal * 0.15);
    });
    expect(off.map((f) => f.id)).toEqual([]);
  });
});

describe('food log repo', () => {
  const entry = (over: Partial<Parameters<typeof repo.addEntry>[1]> = {}) => ({
    date: '2026-09-20',
    meal: 'lunch' as const,
    foodId: 'rice-white-raw',
    name: 'White rice, raw',
    grams: 80,
    ...scale(RICE, 80),
    ...over,
  });

  beforeEach(() => {
    for (const t of [foodLogs, customFoods, syncDeletions, users]) db.delete(t).run();
    db.insert(users).values({ id: U, email: null, authKind: 'local' }).run();
  });

  it('stores the snapshot, so a later catalogue change cannot rewrite history', () => {
    repo.addEntry(U, entry());
    const [row] = repo.dayEntriesQuery(U, '2026-09-20').all();
    expect(row).toMatchObject({ grams: 80, kcal: 292, foodId: 'rice-white-raw' });
  });

  it('accepts a quick-add with no food and no weight', () => {
    repo.addEntry(U, entry({ foodId: null, grams: null, name: 'Tacos', kcal: 650 }));
    expect(repo.dayEntriesQuery(U, '2026-09-20').all()[0]).toMatchObject({
      foodId: null,
      grams: null,
      kcal: 650,
    });
  });

  it('only returns the requested day', () => {
    repo.addEntry(U, entry());
    repo.addEntry(U, entry({ date: '2026-09-19' }));
    expect(repo.dayEntriesQuery(U, '2026-09-20').all()).toHaveLength(1);
  });

  it('tombstones a deleted entry for sync', () => {
    const row = repo.addEntry(U, entry());
    repo.deleteEntry(row.id);
    expect(repo.dayEntriesQuery(U, '2026-09-20').all()).toEqual([]);
    expect(db.select().from(syncDeletions).all()).toMatchObject([
      { tableName: 'food_logs', rowId: row.id },
    ]);
  });

  it('lists recent foods once each, newest first, skipping quick-adds', () => {
    repo.addEntry(U, entry({ foodId: 'banana', grams: 120 }));
    repo.addEntry(U, entry({ foodId: null, grams: null }));
    repo.addEntry(U, entry({ foodId: 'banana', grams: 90 }));
    repo.addEntry(U, entry({ foodId: 'egg-whole', grams: 100 }));

    const recent = repo.recentFoodIds(U);
    expect(recent.map((r) => r.foodId).sort()).toEqual(['banana', 'egg-whole']);
  });

  it('keeps logged entries when the custom food behind them is deleted', () => {
    const food = repo.createCustomFood(U, {
      name: 'Licuado',
      kcal: 90,
      proteinG: 8,
      carbsG: 10,
      fatG: 2,
      fiberG: 1,
      servingG: 300,
    });
    repo.addEntry(U, entry({ foodId: food.id, name: food.name }));

    repo.deleteCustomFood(food.id);

    expect(db.select().from(customFoods).where(eq(customFoods.userId, U)).all()).toEqual([]);
    expect(repo.dayEntriesQuery(U, '2026-09-20').all()).toHaveLength(1);
  });
});

describe('meal ideas', () => {
  it('every ingredient points at a food that exists', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    const broken = MEAL_SEEDS.flatMap((m) =>
      m.ingredients.filter((i) => !ids.has(i.foodId)).map((i) => `${m.id} → ${i.foodId}`),
    );
    expect(broken).toEqual([]);
  });

  it('has unique ids and both languages', () => {
    expect(new Set(MEAL_SEEDS.map((m) => m.id)).size).toBe(MEAL_SEEDS.length);
    expect(MEAL_SEEDS.filter((m) => !m.en.trim() || !m.es.trim())).toEqual([]);
  });

  it('gives every meal at least one slot and real ingredients', () => {
    expect(MEAL_SEEDS.filter((m) => !m.slots.length || m.ingredients.length < 2)).toEqual([]);
  });

  it('totals a meal from its ingredients', () => {
    const meal = mealById('avocado-egg-toast')!;
    const parts = mealIngredients(meal);
    expect(parts).toHaveLength(4);
    expect(mealTotals(meal).kcal).toBe(parts.reduce((s, p) => s + p.totals.kcal, 0));
  });

  it('keeps vegan meals free of animal products', () => {
    const animal = new Set(
      FOODS.filter((f) => f.category === 'protein' || f.category === 'dairy').map((f) => f.id),
    );
    // Plant milks live in the dairy aisle, so they are named rather than inferred.
    const plant = new Set(['soymilk', 'almond-milk', 'coconut-milk']);
    const offenders = MEAL_SEEDS.filter((m) => m.vegan).flatMap((m) =>
      m.ingredients
        .filter((i) => animal.has(i.foodId) && !plant.has(i.foodId))
        .map((i) => `${m.id} → ${i.foodId}`),
    );
    expect(offenders).toEqual([]);
  });

  it('every meal lands in a sane calorie range for a plate', () => {
    const odd = MEAL_SEEDS.filter((m) => {
      const kcal = mealTotals(m).kcal;
      return kcal < 200 || kcal > 1200;
    }).map((m) => `${m.id}:${mealTotals(m).kcal}`);
    expect(odd).toEqual([]);
  });
});

describe('day plans', () => {
  it('every plan meal resolves', () => {
    const broken = PLAN_SEEDS.flatMap((p) =>
      p.meals.filter((m) => !mealById(m.mealId)).map((m) => `${p.id} → ${m.mealId}`),
    );
    expect(broken).toEqual([]);
  });

  it('has unique ids, both languages and a description', () => {
    expect(new Set(PLAN_SEEDS.map((p) => p.id)).size).toBe(PLAN_SEEDS.length);
    expect(
      PLAN_SEEDS.filter((p) => !p.en.trim() || !p.es.trim() || !p.descriptionEs.trim()),
    ).toEqual([]);
  });

  it('a vegan plan only uses vegan meals', () => {
    const offenders = PLAN_SEEDS.filter((p) => p.vegan).flatMap((p) =>
      planMeals(p)
        .filter(({ meal }) => !meal.vegan)
        .map(({ meal }) => `${p.id} → ${meal.id}`),
    );
    expect(offenders).toEqual([]);
  });

  it('adds up to a plausible day, and to the sum of its meals', () => {
    for (const plan of PLAN_SEEDS) {
      const totals = planTotals(plan);
      expect(totals.kcal).toBe(
        planMeals(plan).reduce((s, { meal }) => s + mealTotals(meal).kcal, 0),
      );
      expect(totals.kcal).toBeGreaterThan(1200);
      expect(totals.kcal).toBeLessThan(4000);
      // A day of examples should still be protein-led, or it teaches the wrong thing.
      expect(totals.proteinG).toBeGreaterThan(80);
    }
  });
});

describe('food docs', () => {
  it('writes one page per category, in both languages, with the same ids', () => {
    const en = foodDocs('en');
    const es = foodDocs('es');
    expect(en.map((d) => d.id)).toEqual(es.map((d) => d.id));
    expect(en).toHaveLength(FOOD_CATEGORIES.length);
  });

  it('lists every catalogue food exactly once across the pages', () => {
    const body = foodDocs('en')
      .map((d) => d.body)
      .join('\n');
    const linked = [...body.matchAll(/\]\(\/food\/([a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(new Set(linked).size).toBe(linked.length);
    expect(linked.sort()).toEqual(FOODS.map((f) => f.id).sort());
  });

  it('names foods in the page language', () => {
    expect(foodDocs('es').some((d) => d.body.includes('Aguacate'))).toBe(true);
    expect(foodDocs('en').some((d) => d.body.includes('Avocado'))).toBe(true);
  });
});
