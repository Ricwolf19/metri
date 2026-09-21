import type { LocaleCode } from '@/lib/storage';

import { sumTotals, type Totals } from './diary';
import { mealById, mealTotals, type MealSeed } from './meals';

import type { Meal } from '@/db/schema';

/**
 * Day plans — worked EXAMPLES, not prescriptions: the amounts come from the meal
 * ideas rather than the lifter's targets, so a plan is logged and then adjusted.
 * They reference meals by id and live in code (no table, no seeding): nothing
 * here is user data. Ids are a contract — never rename or reuse one.
 */
export type PlanSeed = {
  id: string;
  en: string;
  es: string;
  descriptionEn: string;
  descriptionEs: string;
  vegan: boolean;
  meals: { slot: Meal; mealId: string }[];
};

export const PLAN_SEEDS: PlanSeed[] = [
  {
    id: 'metri-plate',
    en: 'Metri Plate',
    es: 'Plato Metri',
    descriptionEn:
      'The default day: protein at every meal, carbs around training, vegetables at lunch and dinner. Log it, then adjust the amounts to your own targets.',
    descriptionEs:
      'El día base: proteína en cada comida, carbohidratos alrededor del entrenamiento y verduras en comida y cena. Regístralo y después ajusta las cantidades a tus objetivos.',
    vegan: false,
    meals: [
      { slot: 'breakfast', mealId: 'avocado-egg-toast' },
      { slot: 'lunch', mealId: 'chicken-quinoa-salad' },
      { slot: 'dinner', mealId: 'salmon-quinoa-asparagus' },
      { slot: 'snack', mealId: 'yogurt-fruit-granola' },
    ],
  },
  {
    id: 'metri-lean',
    en: 'Metri Lean',
    es: 'Metri Definición',
    descriptionEn:
      'Leaner sources and lighter fats, for a day in a deficit: high protein, high volume, enough carbs to still train hard.',
    descriptionEs:
      'Fuentes más magras y menos grasa, para un día en déficit: mucha proteína, mucho volumen y los carbohidratos suficientes para seguir entrenando fuerte.',
    vegan: false,
    meals: [
      { slot: 'breakfast', mealId: 'sweet-potato-cottage' },
      { slot: 'lunch', mealId: 'tuna-chickpea-salad' },
      { slot: 'dinner', mealId: 'cod-broccoli-quinoa' },
      { slot: 'snack', mealId: 'protein-fruit-shake' },
    ],
  },
  {
    id: 'metri-plant',
    en: 'Metri Plant-based',
    es: 'Metri Vegano',
    descriptionEn:
      'A fully plant-based day. Protein is the part to watch: every meal carries a real source, not just the grain.',
    descriptionEs:
      'Un día 100% vegetal. La proteína es lo que hay que cuidar: cada comida trae una fuente real, no solo el cereal.',
    vegan: true,
    meals: [
      { slot: 'breakfast', mealId: 'tofu-scramble-toast' },
      { slot: 'lunch', mealId: 'quinoa-edamame-salad' },
      { slot: 'dinner', mealId: 'tempeh-rice-bowl' },
      { slot: 'snack', mealId: 'green-protein-shake' },
    ],
  },
];

export const planName = (plan: PlanSeed, locale: LocaleCode): string =>
  locale === 'es' ? plan.es : plan.en;

export const planDescription = (plan: PlanSeed, locale: LocaleCode): string =>
  locale === 'es' ? plan.descriptionEs : plan.descriptionEn;

const BY_ID = new Map(PLAN_SEEDS.map((p) => [p.id, p]));
export const planById = (id: string): PlanSeed | undefined => BY_ID.get(id);

/** The plan's meals, resolved; an entry pointing at an unknown meal is dropped. */
export const planMeals = (plan: PlanSeed): { slot: Meal; meal: MealSeed }[] =>
  plan.meals.flatMap((m) => {
    const meal = mealById(m.mealId);
    return meal ? [{ slot: m.slot, meal }] : [];
  });

export const planTotals = (plan: PlanSeed): Totals =>
  sumTotals(planMeals(plan).map(({ meal }) => mealTotals(meal)));
