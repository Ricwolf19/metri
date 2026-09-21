import type { LocaleCode } from '@/lib/storage';

import { sumTotals, scale, type Totals } from './diary';
import { FOODS } from './foods.data';
import type { Meal } from '@/db/schema';

/**
 * Meal ideas — worked EXAMPLES, not prescriptions. Each is a combination of
 * catalogue foods with a starting amount; the point is to show what a balanced
 * plate looks like and give a one-tap way to log it, after which the amounts
 * are the lifter's to adjust to their own targets.
 *
 * Ids are a contract: they are written nowhere in the database (logging expands
 * a meal into its ingredient rows), but plans reference them — never reuse one.
 */

type MealIngredient = { foodId: string; grams: number };

export type MealSeed = {
  id: string;
  /** Which slot it fits; a meal may suit several. */
  slots: Meal[];
  /** No animal products anywhere in the ingredients. */
  vegan: boolean;
  en: string;
  es: string;
  ingredients: MealIngredient[];
};

export const MEAL_SEEDS: MealSeed[] = [
  {
    id: 'avocado-egg-toast',
    slots: ['breakfast'],
    vegan: false,
    en: 'Avocado and egg toast',
    es: 'Tostada de aguacate y huevo',
    ingredients: [
      { foodId: 'bread-whole', grams: 60 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'egg-whole', grams: 100 },
      { foodId: 'cheese-fresco', grams: 30 },
    ],
  },
  {
    id: 'mushroom-omelette',
    slots: ['breakfast'],
    vegan: false,
    en: 'Mushroom and salsa omelette',
    es: 'Omelette de champiñones con salsa',
    ingredients: [
      { foodId: 'egg-white', grams: 100 },
      { foodId: 'mushroom', grams: 50 },
      { foodId: 'tomato', grams: 100 },
      { foodId: 'cheese-fresco', grams: 30 },
      { foodId: 'tortilla-corn', grams: 30 },
    ],
  },
  {
    id: 'yogurt-fruit-granola',
    slots: ['breakfast', 'snack'],
    vegan: false,
    en: 'Yogurt with fruit and granola',
    es: 'Yogur con fruta y granola',
    ingredients: [
      { foodId: 'yogurt-plain', grams: 200 },
      { foodId: 'strawberry', grams: 50 },
      { foodId: 'granola', grams: 30 },
      { foodId: 'honey', grams: 7 },
    ],
  },
  {
    id: 'salmon-avocado-toast',
    slots: ['breakfast'],
    vegan: false,
    en: 'Smoked salmon and avocado toast',
    es: 'Tostada de salmón ahumado y aguacate',
    ingredients: [
      { foodId: 'bread-whole', grams: 60 },
      { foodId: 'salmon-smoked', grams: 50 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'cream-cheese', grams: 30 },
    ],
  },
  {
    id: 'protein-fruit-shake',
    slots: ['breakfast', 'snack'],
    vegan: false,
    en: 'Protein and fruit shake',
    es: 'Licuado de proteína con fruta',
    ingredients: [
      { foodId: 'milk-lowfat', grams: 200 },
      { foodId: 'banana', grams: 120 },
      { foodId: 'whey', grams: 30 },
      { foodId: 'almonds', grams: 20 },
    ],
  },
  {
    id: 'oatmeal-apple-cinnamon',
    slots: ['breakfast'],
    vegan: true,
    en: 'Oatmeal with apple and cinnamon',
    es: 'Avena con manzana y canela',
    ingredients: [
      { foodId: 'oats-raw', grams: 60 },
      { foodId: 'apple', grams: 150 },
      { foodId: 'walnuts', grams: 30 },
      { foodId: 'cinnamon', grams: 2 },
    ],
  },
  {
    id: 'sweet-potato-cottage',
    slots: ['breakfast'],
    vegan: false,
    en: 'Baked sweet potato with cottage cheese',
    es: 'Camote al horno con queso cottage',
    ingredients: [
      { foodId: 'sweet-potato-raw', grams: 150 },
      { foodId: 'cottage', grams: 50 },
      { foodId: 'egg-white', grams: 66 },
    ],
  },
  {
    id: 'turkey-mushroom-omelette',
    slots: ['breakfast'],
    vegan: false,
    en: 'Turkey and mushroom omelette',
    es: 'Omelette de pavo y champiñones',
    ingredients: [
      { foodId: 'egg-white', grams: 132 },
      { foodId: 'mushroom', grams: 50 },
      { foodId: 'turkey-deli', grams: 50 },
      { foodId: 'ricotta', grams: 30 },
      { foodId: 'bread-whole', grams: 60 },
    ],
  },
  {
    id: 'cottage-berry-toast',
    slots: ['breakfast', 'snack'],
    vegan: false,
    en: 'Cottage cheese and berry toast',
    es: 'Tostada de cottage con frutos rojos',
    ingredients: [
      { foodId: 'bread-whole', grams: 60 },
      { foodId: 'cottage', grams: 100 },
      { foodId: 'strawberry', grams: 30 },
      { foodId: 'raspberry', grams: 20 },
      { foodId: 'honey', grams: 7 },
    ],
  },
  {
    id: 'asparagus-ham-omelette',
    slots: ['breakfast'],
    vegan: false,
    en: 'Asparagus and ham omelette',
    es: 'Omelette de espárragos y jamón',
    ingredients: [
      { foodId: 'egg-whole', grams: 150 },
      { foodId: 'asparagus', grams: 50 },
      { foodId: 'ham', grams: 50 },
      { foodId: 'gouda', grams: 30 },
    ],
  },

  {
    id: 'chicken-quinoa-salad',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Grilled chicken with quinoa and salad',
    es: 'Pollo a la plancha con quinoa y ensalada',
    ingredients: [
      { foodId: 'chicken-breast-raw', grams: 200 },
      { foodId: 'quinoa-cooked', grams: 185 },
      { foodId: 'lettuce', grams: 100 },
      { foodId: 'tomato', grams: 50 },
      { foodId: 'cucumber', grams: 50 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'fish-tacos-guacamole',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Fish tacos with guacamole',
    es: 'Tacos de pescado con guacamole',
    ingredients: [
      { foodId: 'tilapia', grams: 200 },
      { foodId: 'tortilla-corn', grams: 90 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'beans-black-cooked', grams: 90 },
      { foodId: 'cilantro', grams: 5 },
    ],
  },
  {
    id: 'tuna-chickpea-salad',
    slots: ['lunch'],
    vegan: false,
    en: 'Tuna salad with chickpeas',
    es: 'Ensalada de atún con garbanzos',
    ingredients: [
      { foodId: 'tuna-canned', grams: 150 },
      { foodId: 'chickpeas-cooked', grams: 165 },
      { foodId: 'spinach', grams: 50 },
      { foodId: 'tomato', grams: 30 },
      { foodId: 'onion', grams: 20 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'pork-sweet-potato',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Pork loin with roasted sweet potato',
    es: 'Lomo de cerdo con camote al horno',
    ingredients: [
      { foodId: 'pork-loin', grams: 200 },
      { foodId: 'sweet-potato-raw', grams: 200 },
      { foodId: 'broccoli', grams: 90 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'salmon-quinoa-asparagus',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Baked salmon with quinoa and asparagus',
    es: 'Salmón al horno con quinoa y espárragos',
    ingredients: [
      { foodId: 'salmon', grams: 200 },
      { foodId: 'quinoa-cooked', grams: 185 },
      { foodId: 'asparagus', grams: 135 },
    ],
  },
  {
    id: 'beef-rice-vegetables',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Beef with brown rice and vegetables',
    es: 'Res con arroz integral y verduras',
    ingredients: [
      { foodId: 'beef-sirloin', grams: 200 },
      { foodId: 'rice-brown-cooked', grams: 195 },
      { foodId: 'broccoli', grams: 90 },
      { foodId: 'carrot', grams: 50 },
    ],
  },
  {
    id: 'turkey-meatballs-pasta',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Pasta with turkey meatballs',
    es: 'Pasta con albóndigas de pavo',
    ingredients: [
      { foodId: 'pasta-cooked', grams: 140 },
      { foodId: 'turkey-ground', grams: 200 },
      { foodId: 'salsa', grams: 60 },
      { foodId: 'lettuce', grams: 100 },
    ],
  },
  {
    id: 'lentils-chicken',
    slots: ['lunch', 'dinner'],
    vegan: false,
    en: 'Stewed lentils with chicken breast',
    es: 'Lentejas guisadas con pechuga de pollo',
    ingredients: [
      { foodId: 'lentils-cooked', grams: 200 },
      { foodId: 'chicken-breast-raw', grams: 150 },
      { foodId: 'tomato', grams: 50 },
      { foodId: 'onion', grams: 30 },
    ],
  },
  {
    id: 'cod-broccoli-quinoa',
    slots: ['dinner'],
    vegan: false,
    en: 'Baked cod with broccoli and quinoa',
    es: 'Bacalao al horno con brócoli y quinoa',
    ingredients: [
      { foodId: 'cod', grams: 200 },
      { foodId: 'broccoli', grams: 90 },
      { foodId: 'quinoa-cooked', grams: 185 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'tuna-avocado-salad',
    slots: ['dinner'],
    vegan: false,
    en: 'Tuna and avocado salad',
    es: 'Ensalada de atún y aguacate',
    ingredients: [
      { foodId: 'tuna-canned', grams: 150 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'lettuce', grams: 100 },
      { foodId: 'tomato', grams: 50 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'chicken-tacos-beans',
    slots: ['dinner'],
    vegan: false,
    en: 'Chicken tacos with guacamole and beans',
    es: 'Tacos de pollo con guacamole y frijoles',
    ingredients: [
      { foodId: 'chicken-breast-raw', grams: 200 },
      { foodId: 'tortilla-corn', grams: 90 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'beans-black-cooked', grams: 90 },
    ],
  },

  {
    id: 'tofu-curry-quinoa',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Curry tofu with quinoa',
    es: 'Tofu al curry con quinoa',
    ingredients: [
      { foodId: 'tofu', grams: 200 },
      { foodId: 'quinoa-cooked', grams: 185 },
      { foodId: 'coconut-milk', grams: 50 },
      { foodId: 'spinach', grams: 50 },
      { foodId: 'avocado', grams: 50 },
    ],
  },
  {
    id: 'lentil-sweet-potato',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Lentils with roasted sweet potato',
    es: 'Lentejas con camote al horno',
    ingredients: [
      { foodId: 'lentils-cooked', grams: 200 },
      { foodId: 'sweet-potato-raw', grams: 200 },
      { foodId: 'spinach', grams: 50 },
      { foodId: 'tomato', grams: 50 },
    ],
  },
  {
    id: 'chickpea-curry-rice',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Chickpea curry with rice',
    es: 'Curry de garbanzos con arroz',
    ingredients: [
      { foodId: 'chickpeas-cooked', grams: 200 },
      { foodId: 'rice-white-cooked', grams: 185 },
      { foodId: 'coconut-milk', grams: 50 },
      { foodId: 'spinach', grams: 100 },
    ],
  },
  {
    id: 'vegan-tacos-soy',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Vegan tacos with textured soy',
    es: 'Tacos veganos de soya texturizada',
    ingredients: [
      { foodId: 'soy-textured', grams: 60 },
      { foodId: 'tortilla-corn', grams: 90 },
      { foodId: 'avocado', grams: 80 },
      { foodId: 'beans-black-cooked', grams: 90 },
      { foodId: 'tomato', grams: 50 },
    ],
  },
  {
    id: 'tempeh-rice-bowl',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Brown rice bowl with tempeh',
    es: 'Bowl de arroz integral con tempeh',
    ingredients: [
      { foodId: 'tempeh', grams: 200 },
      { foodId: 'rice-brown-cooked', grams: 195 },
      { foodId: 'broccoli', grams: 90 },
      { foodId: 'soy-sauce', grams: 10 },
    ],
  },
  {
    id: 'quinoa-edamame-salad',
    slots: ['lunch', 'dinner'],
    vegan: true,
    en: 'Quinoa salad with edamame and avocado',
    es: 'Ensalada de quinoa con edamame y aguacate',
    ingredients: [
      { foodId: 'quinoa-cooked', grams: 185 },
      { foodId: 'edamame', grams: 100 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'tomato', grams: 50 },
      { foodId: 'olive-oil', grams: 10 },
    ],
  },
  {
    id: 'hummus-wrap',
    slots: ['lunch', 'snack'],
    vegan: true,
    en: 'Wrap with hummus and vegetables',
    es: 'Wrap de hummus con verduras',
    ingredients: [
      { foodId: 'tortilla-flour', grams: 70 },
      { foodId: 'hummus', grams: 50 },
      { foodId: 'avocado', grams: 50 },
      { foodId: 'lettuce', grams: 40 },
      { foodId: 'bell-pepper', grams: 40 },
      { foodId: 'chickpeas-cooked', grams: 100 },
    ],
  },
  {
    id: 'tofu-scramble-toast',
    slots: ['breakfast'],
    vegan: true,
    en: 'Tofu scramble with spinach and toast',
    es: 'Tofu revuelto con espinaca y tostada',
    ingredients: [
      { foodId: 'tofu', grams: 200 },
      { foodId: 'spinach', grams: 50 },
      { foodId: 'avocado', grams: 50 },
      { foodId: 'bread-whole', grams: 60 },
    ],
  },
  {
    id: 'oatmeal-almond-milk',
    slots: ['breakfast'],
    vegan: true,
    en: 'Oatmeal with almond milk and fruit',
    es: 'Avena con leche de almendra y fruta',
    ingredients: [
      { foodId: 'oats-raw', grams: 60 },
      { foodId: 'almond-milk', grams: 200 },
      { foodId: 'banana', grams: 100 },
      { foodId: 'chia', grams: 15 },
    ],
  },
  {
    id: 'green-protein-shake',
    slots: ['breakfast', 'snack'],
    vegan: true,
    en: 'Green protein shake',
    es: 'Licuado verde de proteína',
    ingredients: [
      { foodId: 'soymilk', grams: 300 },
      { foodId: 'spinach', grams: 50 },
      { foodId: 'banana', grams: 120 },
      { foodId: 'peanut-butter', grams: 20 },
    ],
  },
  {
    id: 'chia-pudding-fruit',
    slots: ['breakfast', 'snack'],
    vegan: true,
    en: 'Chia pudding with fruit',
    es: 'Pudín de chía con fruta',
    ingredients: [
      { foodId: 'chia', grams: 30 },
      { foodId: 'coconut-milk', grams: 100 },
      { foodId: 'strawberry', grams: 60 },
      { foodId: 'kiwi', grams: 40 },
      { foodId: 'almonds', grams: 20 },
    ],
  },
  {
    id: 'tempeh-avocado-toast',
    slots: ['breakfast', 'lunch'],
    vegan: true,
    en: 'Tempeh and avocado toast',
    es: 'Tostada de tempeh y aguacate',
    ingredients: [
      { foodId: 'tempeh', grams: 150 },
      { foodId: 'avocado', grams: 100 },
      { foodId: 'bread-whole', grams: 60 },
    ],
  },
];

const BY_ID = new Map(MEAL_SEEDS.map((m) => [m.id, m]));
export const mealById = (id: string): MealSeed | undefined => BY_ID.get(id);

export const mealName = (meal: MealSeed, locale: LocaleCode): string =>
  locale === 'es' ? meal.es : meal.en;

const FOOD_BY_ID = new Map(FOODS.map((f) => [f.id, f]));

/** Each ingredient with the food it points at; unknown ids are dropped. */
export const mealIngredients = (meal: MealSeed) =>
  meal.ingredients.flatMap((i) => {
    const food = FOOD_BY_ID.get(i.foodId);
    return food ? [{ food, grams: i.grams, totals: scale(food, i.grams) }] : [];
  });

export const mealTotals = (meal: MealSeed): Totals =>
  sumTotals(mealIngredients(meal).map((i) => i.totals));
