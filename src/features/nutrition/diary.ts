import type { Meal } from '@/db/schema';

import type { Per100 } from './foods';

/**
 * The number that matters here is the WEEKLY AVERAGE of calories, not any one
 * day: a single day over or under means nothing, and it is the average that is
 * compared with the weight trend when deciding whether to adjust a phase.
 */

export const MEALS: readonly Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type Totals = Per100;

const ZERO: Totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
const round1 = (n: number): number => Math.round(n * 10) / 10;

export const scale = (per100: Per100, grams: number): Totals => {
  const k = Math.max(0, grams) / 100;
  return {
    kcal: Math.round(per100.kcal * k),
    proteinG: round1(per100.proteinG * k),
    carbsG: round1(per100.carbsG * k),
    fatG: round1(per100.fatG * k),
    fiberG: round1(per100.fiberG * k),
  };
};

export const sumTotals = (entries: readonly Totals[]): Totals =>
  entries.reduce<Totals>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      proteinG: round1(acc.proteinG + e.proteinG),
      carbsG: round1(acc.carbsG + e.carbsG),
      fatG: round1(acc.fatG + e.fatG),
      fiberG: round1(acc.fiberG + e.fiberG),
    }),
    ZERO,
  );

/** Entries grouped per meal, every meal present so the screen never reflows. */
export const byMeal = <T extends { meal: Meal }>(entries: readonly T[]): Record<Meal, T[]> => {
  const out: Record<Meal, T[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of entries) out[e.meal].push(e);
  return out;
};

export type WeeklyIntake = {
  /** Mean over the days that were LOGGED — an unlogged day is unknown, not zero. */
  avgKcal: number | null;
  avgProteinG: number | null;
  daysLogged: number;
};

/** The last 7 days ending on `today` ('YYYY-MM-DD'), from that window's entries. */
export const weeklyIntake = (
  entries: readonly (Totals & { date: string })[],
  windowStart: string,
  today: string,
): WeeklyIntake => {
  const perDay = new Map<string, { kcal: number; proteinG: number }>();
  for (const e of entries) {
    if (e.date < windowStart || e.date > today) continue;
    const day = perDay.get(e.date) ?? { kcal: 0, proteinG: 0 };
    perDay.set(e.date, { kcal: day.kcal + e.kcal, proteinG: day.proteinG + e.proteinG });
  }
  const days = [...perDay.values()];
  if (!days.length) return { avgKcal: null, avgProteinG: null, daysLogged: 0 };
  return {
    avgKcal: Math.round(days.reduce((s, d) => s + d.kcal, 0) / days.length),
    avgProteinG: Math.round(days.reduce((s, d) => s + d.proteinG, 0) / days.length),
    daysLogged: days.length,
  };
};

/** Share of a target reached, clamped for a progress bar; 0 with no target. */
export const progress = (value: number, target: number | null | undefined): number =>
  target && target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
