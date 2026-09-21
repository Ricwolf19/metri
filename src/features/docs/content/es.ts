import { foodDocs } from '@/features/nutrition/food-docs';

import type { DocSection } from '../types';

import { gettingStarted } from './es/getting-started';
import { app } from './es/app';
import { calculators } from './es/calculators';
import { nutrition } from './es/nutrition';
import { training } from './es/training';
import { cardio } from './es/cardio';
import { recovery } from './es/recovery';
import { supplements } from './es/supplements';
import { progress } from './es/progress';
import { glossary } from './es/glossary';

/**
 * Spanish knowledge base — mirrors the ids/order in `en.ts` (enforced by docs.test.ts).
 */
export const es: DocSection[] = [
  ...gettingStarted,
  ...app,
  ...calculators,
  ...nutrition,
  // Generated from the food catalogue — see features/nutrition/food-docs.
  ...foodDocs('es'),
  ...training,
  ...cardio,
  ...recovery,
  ...supplements,
  ...progress,
  ...glossary,
];
