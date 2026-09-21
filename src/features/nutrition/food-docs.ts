import type { DocSection } from '@/features/docs/types';
import type { LocaleCode } from '@/lib/storage';

import { FOOD_CATEGORIES, fromCatalog, type FoodCategory } from './foods';
import { FOODS } from './foods.data';

/**
 * The food catalogue as knowledge-base pages, one per category. Generated from
 * `FOODS` at module load, so a catalogue rebuild updates the docs and the two
 * can never disagree. Each row links to `/food/<id>`, which `openContentLink`
 * routes to the food card.
 */

const TITLES: Record<FoodCategory, Record<LocaleCode, string>> = {
  protein: { en: 'Meat, fish and eggs', es: 'Carne, pescado y huevo' },
  dairy: { en: 'Dairy', es: 'Lácteos' },
  legumes: { en: 'Legumes and plant protein', es: 'Leguminosas y proteína vegetal' },
  grains: { en: 'Grains and starches', es: 'Cereales y almidones' },
  vegetables: { en: 'Vegetables', es: 'Verduras' },
  fruit: { en: 'Fruit', es: 'Fruta' },
  fats: { en: 'Fats, nuts and seeds', es: 'Grasas, frutos secos y semillas' },
  other: { en: 'Other foods', es: 'Otros alimentos' },
};

const LEAD: Record<FoodCategory, Record<LocaleCode, string>> = {
  protein: {
    en: 'Your protein anchors. Values are for **raw** weight unless the name says cooked — meat loses roughly 20–25% of its weight cooking, so the same piece reads higher per 100 g once it leaves the pan.',
    es: 'Tus anclas de proteína. Los valores son en **crudo** salvo que el nombre diga cocido — la carne pierde cerca de 20–25% de su peso al cocinarse, así que la misma pieza marca más por 100 g al salir del sartén.',
  },
  dairy: {
    en: 'Protein that doubles as a snack. Fat is what separates most of these from each other, so it is the lever when calories need to move.',
    es: 'Proteína que además funciona como colación. La grasa es lo que más las diferencia entre sí, así que es la palanca cuando hay que mover calorías.',
  },
  legumes: {
    en: 'Protein and carbs in the same food, plus most of the fibre in a plant-based day. Dry and cooked weights differ by roughly 3×.',
    es: 'Proteína y carbohidratos en el mismo alimento, además de casi toda la fibra de un día vegetal. El peso en crudo y cocido difiere cerca de 3×.',
  },
  grains: {
    en: 'Your main training fuel, and the macro that moves when calories change. Dry and cooked weights are very different — 100 g of dry rice is about 300 g cooked.',
    es: 'Tu principal combustible de entrenamiento, y el macro que se mueve cuando cambian las calorías. El peso en seco y cocido cambia mucho — 100 g de arroz crudo son unos 300 g cocido.',
  },
  vegetables: {
    en: 'Volume, fibre and micronutrients for very few calories. They are what makes a deficit feel like food instead of a rule.',
    es: 'Volumen, fibra y micronutrientes por muy pocas calorías. Son lo que hace que un déficit se sienta comida y no una regla.',
  },
  fruit: {
    en: 'Carbs with fibre and water. Easy to eat and easy to log — most of it is worth less than people assume.',
    es: 'Carbohidratos con fibra y agua. Fácil de comer y fácil de registrar — casi toda vale menos de lo que la gente supone.',
  },
  fats: {
    en: 'The most energy-dense things you will log: nine calories a gram, and oils are nearly pure fat. Weigh them — a spoonful eyeballed is the most common tracking error there is.',
    es: 'Lo más denso en energía que vas a registrar: nueve calorías por gramo, y los aceites son casi grasa pura. Pésalos — una cucharada a ojo es el error de registro más común que existe.',
  },
  other: {
    en: 'Condiments, sweeteners and drinks. Small amounts, but oils and sugars hide real calories in them.',
    es: 'Condimentos, endulzantes y bebidas. Cantidades pequeñas, pero los aceites y azúcares esconden calorías reales.',
  },
};

const TABLE_HEAD: Record<LocaleCode, string> = {
  en: '| Food | kcal | Protein | Carbs | Fat |\n| --- | --- | --- | --- | --- |',
  es: '| Alimento | kcal | Proteína | Carbos | Grasa |\n| --- | --- | --- | --- | --- |',
};

const PER_100: Record<LocaleCode, string> = {
  en: 'Everything below is **per 100 g**. Tap a food to open its card, where you can see any portion.',
  es: 'Todo lo de abajo es **por 100 g**. Toca un alimento para abrir su ficha, donde puedes ver cualquier porción.',
};

const CREDIT: Record<LocaleCode, string> = {
  en: 'Values: USDA FoodData Central.',
  es: 'Valores: USDA FoodData Central.',
};

const TAGS: Record<FoodCategory, string[]> = {
  protein: ['food', 'protein', 'meat', 'fish', 'eggs'],
  dairy: ['food', 'dairy', 'protein'],
  legumes: ['food', 'legumes', 'vegan', 'protein', 'fiber'],
  grains: ['food', 'carbs', 'grains'],
  vegetables: ['food', 'vegetables', 'fiber'],
  fruit: ['food', 'fruit', 'carbs'],
  fats: ['food', 'fats', 'nuts', 'seeds'],
  other: ['food', 'condiments'],
};

const docFor = (category: FoodCategory, locale: LocaleCode): DocSection => {
  const rows = FOODS.filter((f) => f.category === category)
    .map((f) => fromCatalog(f, locale))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
    .map(
      (f) =>
        `| [${f.name}](/food/${f.id}) | ${Math.round(f.kcal)} | ${f.proteinG} g | ${f.carbsG} g | ${f.fatG} g |`,
    );

  return {
    id: `foods-${category}`,
    category: 'nutrition',
    title: TITLES[category][locale],
    tags: TAGS[category],
    body: [
      LEAD[category][locale],
      '',
      PER_100[locale],
      '',
      TABLE_HEAD[locale],
      ...rows,
      '',
      CREDIT[locale],
    ].join('\n'),
  };
};

export const foodDocs = (locale: LocaleCode): DocSection[] =>
  FOOD_CATEGORIES.map((c) => docFor(c, locale));
