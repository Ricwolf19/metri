import { foodDocs } from '@/features/nutrition/food-docs';

import type { DocSection } from '../types';

import { gettingStarted } from './en/getting-started';
import { app } from './en/app';
import { calculators } from './en/calculators';
import { nutrition } from './en/nutrition';
import { training } from './en/training';
import { cardio } from './en/cardio';
import { recovery } from './en/recovery';
import { supplements } from './en/supplements';
import { progress } from './en/progress';
import { glossary } from './en/glossary';

/**
 * English knowledge base, one module per category (see docs/README in AGENTS.md).
 * Category order here is the Explore order inside each topic; `es.ts` must keep the same id sequence.
 */
export const en: DocSection[] = [
  ...gettingStarted,
  ...app,
  ...calculators,
  ...nutrition,
  // Generated from the food catalogue — see features/nutrition/food-docs.
  ...foodDocs('en'),
  ...training,
  ...cardio,
  ...recovery,
  ...supplements,
  ...progress,
  ...glossary,
];
