import { settings, type Units } from '@/lib/storage';

import { parseLadder, type Ladder } from './ladder';
import { DEFAULT_DUMBBELL_RACK } from './plate-math';

/**
 * The gym's dumbbell rack, per equipment unit: a DEVICE setting like the unit
 * itself (every dumbbell exercise in one gym draws from the same rack), edited
 * in the weight sheet. Dumbbell rows pick from it rather than type a number.
 */
export const dumbbellRack = (unit: Units): Ladder =>
  parseLadder(settings.getDumbbellRack(unit)) ?? DEFAULT_DUMBBELL_RACK[unit];

export const saveDumbbellRack = (unit: Units, rack: Ladder): void =>
  settings.setDumbbellRack(unit, rack);
