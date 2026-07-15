import { FULL_BODY_3 } from './full-body-3';
import { POWERBUILDING_2 } from './powerbuilding-2';
import type { ProgramSeed } from './types';
import { UPPER_LOWER_4 } from './upper-lower-4';

export * from './types';

/** Every built-in program template, in the order shown when browsing. */
export const PROGRAM_SEEDS: ProgramSeed[] = [POWERBUILDING_2, UPPER_LOWER_4, FULL_BODY_3];
