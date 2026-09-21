import { and, asc, desc, eq, gte, isNotNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { customFoods, foodLogs, type FoodLog, type Meal } from '@/db/schema';
import { recordDeletion } from '@/features/sync/tombstones';
import { randomId } from '@/lib/crypto';

import type { Totals } from './diary';

export type NewEntry = Totals & {
  date: string;
  meal: Meal;
  /** Catalogue slug or custom-food id; null for a quick-add. */
  foodId: string | null;
  name: string;
  grams: number | null;
};

export const addEntry = (userId: string, entry: NewEntry): FoodLog => {
  const [row] = db
    .insert(foodLogs)
    .values({ id: randomId(), userId, ...entry })
    .returning()
    .all();
  return row;
};

export const deleteEntry = (id: string): void => {
  db.delete(foodLogs).where(eq(foodLogs.id, id)).run();
  recordDeletion('food_logs', id);
};

/** Live query: one day's entries in the order they were logged. */
export const dayEntriesQuery = (userId: string, date: string) =>
  db
    .select()
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), eq(foodLogs.date, date)))
    .orderBy(asc(foodLogs.createdAt));

/** Live query: everything since `since`, for the weekly average. */
export const entriesSinceQuery = (userId: string, since: string) =>
  db
    .select({
      date: foodLogs.date,
      kcal: foodLogs.kcal,
      proteinG: foodLogs.proteinG,
      carbsG: foodLogs.carbsG,
      fatG: foodLogs.fatG,
      fiberG: foodLogs.fiberG,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), gte(foodLogs.date, since)));

/**
 * Food ids most recently logged, newest first, each once — what people eat is
 * mostly what they ate last week, so this list is the fastest path to an entry.
 */
export const recentFoodIds = (userId: string, limit = 12): { foodId: string; grams: number }[] => {
  const rows = db
    .select({ foodId: foodLogs.foodId, grams: foodLogs.grams })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, userId), isNotNull(foodLogs.foodId)))
    .orderBy(desc(foodLogs.createdAt))
    .limit(limit * 6)
    .all();
  const seen = new Map<string, number>();
  for (const r of rows) {
    if (r.foodId && !seen.has(r.foodId)) seen.set(r.foodId, r.grams ?? 100);
    if (seen.size >= limit) break;
  }
  return [...seen].map(([foodId, grams]) => ({ foodId, grams }));
};

export type CustomFoodInput = {
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingG: number;
};

export const customFoodsQuery = (userId: string) =>
  db
    .select()
    .from(customFoods)
    .where(eq(customFoods.userId, userId))
    .orderBy(asc(customFoods.name));

export const createCustomFood = (userId: string, input: CustomFoodInput) => {
  const [row] = db
    .insert(customFoods)
    .values({ id: randomId(), userId, ...input })
    .returning()
    .all();
  return row;
};

/** Logged entries keep their own snapshot, so deleting a food never touches history. */
export const deleteCustomFood = (id: string): void => {
  db.delete(customFoods).where(eq(customFoods.id, id)).run();
  recordDeletion('custom_foods', id);
};

/**
 * Log a meal idea as its INGREDIENT rows, not as one lump: the lifter can then
 * drop the avocado they skipped or change the rice without losing the rest.
 * `scaled` lets a plan or a portion tweak scale every ingredient at once.
 */
export const addMealEntries = (
  userId: string,
  { date, meal, items }: { date: string; meal: Meal; items: Omit<NewEntry, 'date' | 'meal'>[] },
): void => {
  db.transaction((tx) => {
    for (const item of items) {
      tx.insert(foodLogs)
        .values({ id: randomId(), userId, ...item, date, meal })
        .run();
    }
  });
};
