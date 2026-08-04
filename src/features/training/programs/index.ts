import type { ProgramSeed } from './types';

export * from './types';

/**
 * Built-in program templates. Deliberately empty: programs are user-authored
 * (the editor supports full periodization — set groups, alternatives, weekly
 * RIR). Curated templates may return here later; ids of retired seeds
 * (pb-2-0, ul-4, fb-3) must never be reused.
 */
export const PROGRAM_SEEDS: ProgramSeed[] = [];
