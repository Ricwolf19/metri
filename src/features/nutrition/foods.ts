import type { CustomFood } from '@/db/schema';
import type { LocaleCode } from '@/lib/storage';

/** Shelf the food sits on. Drives grouping and the knowledge-base pages, so a
 * new one needs an i18n key (`food.category.*`) and a docs entry. */
export type FoodCategory =
  'grains' | 'protein' | 'dairy' | 'legumes' | 'fruit' | 'vegetables' | 'fats' | 'other';

export const FOOD_CATEGORIES: FoodCategory[] = [
  'protein',
  'dairy',
  'legumes',
  'grains',
  'vegetables',
  'fruit',
  'fats',
  'other',
];

/** Nutrients per 100 g — the one unit every food in the app is stored in. */
export type Per100 = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

/**
 * A shipped food. Values come from USDA FoodData Central at build time
 * (`scripts/build-foods.ts`); the bilingual names and the selection are ours.
 * `id` is a slug and is written into `food_logs.foodId` — never rename one.
 */
export type CatalogFood = Per100 & {
  id: string;
  fdcId: number;
  en: string;
  es: string;
  category: FoodCategory;
  servingG: number;
};

/** What the search and the amount sheet work with, whatever its origin. */
export type Food = Per100 & {
  id: string;
  name: string;
  servingG: number;
  source: 'catalog' | 'custom';
};

export const fromCatalog = (f: CatalogFood, locale: LocaleCode): Food => ({
  id: f.id,
  name: locale === 'es' ? f.es : f.en,
  servingG: f.servingG,
  source: 'catalog',
  kcal: f.kcal,
  proteinG: f.proteinG,
  carbsG: f.carbsG,
  fatG: f.fatG,
  fiberG: f.fiberG,
});

export const fromCustom = (f: CustomFood): Food => ({
  id: f.id,
  name: f.name,
  servingG: f.servingG,
  source: 'custom',
  kcal: f.kcal,
  proteinG: f.proteinG,
  carbsG: f.carbsG,
  fatG: f.fatG,
  fiberG: f.fiberG,
});

/** Lower-case, accents stripped — "plátano" must find "platano" and vice versa. */
const fold = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Every query word must appear in the name. Names starting with the query's
 * first word rank first, then shorter names — "rice" surfaces "Rice…" before
 * "Brown rice".
 */
export const searchFoods = (foods: readonly Food[], query: string): Food[] => {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const first = words[0];
  return foods
    .map((food) => ({ food, name: fold(food.name) }))
    .filter(({ name }) => words.every((w) => name.includes(w)))
    .sort(
      (a, b) =>
        Number(b.name.startsWith(first)) - Number(a.name.startsWith(first)) ||
        a.name.length - b.name.length,
    )
    .map(({ food }) => food);
};

/** The label for a logged entry: the catalogue's name in the CURRENT language
 * when the food is still known, else the name as it was logged. */
export const entryLabel = (
  entry: { foodId: string | null; name: string },
  catalog: readonly CatalogFood[],
  locale: LocaleCode,
): string => {
  const known = entry.foodId ? catalog.find((f) => f.id === entry.foodId) : undefined;
  return known ? (locale === 'es' ? known.es : known.en) : entry.name;
};
