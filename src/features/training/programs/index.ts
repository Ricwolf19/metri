import type { Locale } from '@/i18n';

import { FOUNDATIONS_CONTENT, METRI_FOUNDATIONS } from './metri-foundations';
import { METRI_PROGRESSION, PROGRESSION_CONTENT } from './metri-progression';
import type { ProgramSeed } from './types';

export type { ProgramSeed } from './types';

/**
 * Built-in program templates. Ids of retired seeds (pb-2-0, ul-4, fb-3)
 * must never be reused.
 */
export const PROGRAM_SEEDS: ProgramSeed[] = [METRI_FOUNDATIONS, METRI_PROGRESSION];

type PresetCopy = {
  name: string;
  description: string;
  routines: Record<string, string>;
  /** `${routineSlug}.${daySlug}` → localized day name. */
  days: Record<string, string>;
};

/** Bilingual display copy for the preset templates, keyed by template id.
 * Templates keep an EN base in SQLite; the UI resolves through this, and
 * enrolling writes the resolved strings into the user's copy. */
const PRESET_CONTENT: Record<string, Record<Locale, PresetCopy>> = {
  [METRI_FOUNDATIONS.id]: FOUNDATIONS_CONTENT,
  [METRI_PROGRESSION.id]: PROGRESSION_CONTENT,
};

/** Localized name/description for a preset template program (null for others). */
export const presetProgramCopy = (
  programId: string,
  locale: Locale,
): { name: string; description: string } | null => {
  const c = PRESET_CONTENT[programId]?.[locale];
  return c ? { name: c.name, description: c.description } : null;
};

/** Localized routine name for a preset template routine (deterministic ids:
 * routine id = `${programId}-${slug}`). Falls back to the stored name. */
export const presetRoutineName = (
  programId: string,
  routineId: string,
  fallback: string,
  locale: Locale,
): string => {
  const slug = routineId.startsWith(`${programId}-`) ? routineId.slice(programId.length + 1) : null;
  return (slug && PRESET_CONTENT[programId]?.[locale]?.routines[slug]) || fallback;
};

/** Localized day name (day id = `${routineId}-${daySlug}`). */
export const presetDayName = (
  programId: string,
  routineId: string,
  dayId: string,
  fallback: string,
  locale: Locale,
): string => {
  if (!routineId.startsWith(`${programId}-`) || !dayId.startsWith(`${routineId}-`)) {
    return fallback;
  }
  const routineSlug = routineId.slice(programId.length + 1);
  const daySlug = dayId.slice(routineId.length + 1);
  return PRESET_CONTENT[programId]?.[locale]?.days[`${routineSlug}.${daySlug}`] || fallback;
};
