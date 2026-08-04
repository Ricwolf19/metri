import type { ComponentType } from 'react';

import { ActivityIcon, DumbbellIcon, FlameIcon, type IconProps } from '@/components/icons';

import { bmiConfig, bodyfat, ffmiConfig, idealweight, leanmass, whtr } from './configs/body';
import { heartrate, water } from './configs/cardio';
import { calsburned, deficit, macrosConfig, protein, tdeeConfig } from './configs/energy';
import { onerm, plates, wilks } from './configs/strength';
import { CALC_CONTENT } from './content';
import type { CalcConfig, CalcId } from './types';

export const CALCULATORS: Record<CalcId, CalcConfig> = {
  onerm,
  tdee: tdeeConfig,
  macros: macrosConfig,
  bodyfat,
  bmi: bmiConfig,
  ffmi: ffmiConfig,
  water,
  plates,
  idealweight,
  deficit,
  protein,
  leanmass,
  heartrate,
  whtr,
  wilks,
  calsburned,
};

/** Display metadata for the calculator list (icon per calc; title/subtitle come
 * from CALC_CONTENT[id][locale].h1 / .tagline). Ordered popular-first. */
export type CalcMeta = { id: CalcId; icon: ComponentType<IconProps> };

/** Deep-link from a calculator to its in-app guide (doc slug), where one exists. */
export const CALC_DOC: Partial<Record<CalcId, string>> = {
  tdee: 'bmr-tdee-guide',
  macros: 'macros-calculator-guide',
  bodyfat: 'body-fat-guide',
  ffmi: 'ffmi-guide',
  onerm: 'one-rep-max-guide',
  water: 'hydration-calculator-guide',
  bmi: 'bmi-healthy-weight',
};

export const CALC_META: CalcMeta[] = [
  { id: 'tdee', icon: FlameIcon },
  { id: 'macros', icon: FlameIcon },
  { id: 'bmi', icon: ActivityIcon },
  { id: 'bodyfat', icon: ActivityIcon },
  { id: 'onerm', icon: DumbbellIcon },
  { id: 'idealweight', icon: ActivityIcon },
  { id: 'ffmi', icon: ActivityIcon },
  { id: 'leanmass', icon: ActivityIcon },
  { id: 'whtr', icon: ActivityIcon },
  { id: 'water', icon: ActivityIcon },
  { id: 'protein', icon: FlameIcon },
  { id: 'deficit', icon: FlameIcon },
  { id: 'calsburned', icon: FlameIcon },
  { id: 'heartrate', icon: ActivityIcon },
  { id: 'plates', icon: DumbbellIcon },
  { id: 'wilks', icon: DumbbellIcon },
];

/** Short display name: drops the "X calculator" boilerplate the H1s carry. */
export const calcShortTitle = (id: CalcId, locale: 'en' | 'es'): string =>
  CALC_CONTENT[id][locale].h1.replace(/^Calculadora de /i, '').replace(/ calculator$/i, '');
