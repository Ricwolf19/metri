import type { CalcId } from '@/features/calculators/types';
import type { DocCategory } from '@/features/docs/types';
import type { TranslationKey } from '@/i18n/en';

/**
 * One curated topic per section, mixing the calculators and guides that belong
 * together — the reader thinks in themes ("nutrition"), not in content types
 * ("calculator vs doc"). Every calc id and doc category appears exactly once.
 * Shared by Explore and the quick-actions picker so both section identically.
 */
export type ExploreTopic = {
  key: TranslationKey;
  calcs: CalcId[];
  docCategories: DocCategory[];
};

export const TOPICS: ExploreTopic[] = [
  {
    key: 'explore.topicTraining',
    calcs: ['onerm', 'plates', 'wilks'],
    docCategories: ['training'],
  },
  {
    key: 'explore.topicNutrition',
    calcs: ['tdee', 'macros', 'protein', 'deficit', 'calsburned', 'water'],
    docCategories: ['nutrition', 'supplements'],
  },
  {
    key: 'explore.topicBody',
    calcs: ['bmi', 'bodyfat', 'ffmi', 'leanmass', 'idealweight', 'whtr'],
    docCategories: ['progress'],
  },
  {
    key: 'explore.topicCardio',
    calcs: ['heartrate'],
    docCategories: ['recovery'],
  },
  {
    key: 'explore.topicBasics',
    calcs: [],
    docCategories: ['getting-started', 'calculators', 'glossary'],
  },
];
