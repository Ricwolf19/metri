import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { deriveLoad, kgToUnit, seedFromPlates, type LoadDetail, type RowInputMode } from './load';
import { sideFieldFromTotal } from './plate-math';
import { weightText } from './set-prefill';
import type { RowDraft } from './workout-drafts';

/** What `nextSetPrefill` hands the row: the number, the reps and how it was built. */
type Fill = { weightKg: number | null; reps: number; load: LoadDetail | null };

/**
 * The draft a live row opens with, from its prefill — set 1 from the previous
 * session, later sets from the set just logged. The picture always travels
 * with the number: a plate-loaded row opens on the SAME plates (the side and
 * the total follow them, `seedFromPlates`), and when the source carried no
 * picture (a set logged before plates existed, a plain total) one is derived
 * for this row's mode — plates split onto the rack, a total on its pin, one
 * dumbbell counted by the exercise's hands — so the picker field and the load
 * sheet never open on a bare number the rack cannot show.
 */
export const seedRow = (input: {
  fill: Fill;
  mode: RowInputMode;
  unit: Units;
  /** The exercise's saved load config (bar, sled, stack). */
  setting: LoadDetail | null | undefined;
  /** How many dumbbells a set moves (`exerciseHands`). */
  hands: 1 | 2;
}): RowDraft => {
  const { fill, mode, unit, setting, hands } = input;
  const reps = String(fill.reps);
  const perSide = mode.mode === 'perSide' ? mode : null;
  // Plates first: the side and the total follow them, so a seed never reopens
  // on a rounded total that no longer matches the detail.
  const plates = perSide ? seedFromPlates(fill.load, perSide.baseKg, perSide.sides, unit) : null;
  if (plates) return { ...plates, reps, effort: null };
  const weight = fill.weightKg != null ? weightText(fill.weightKg, unit) : '';
  const value = perSide
    ? sideFieldFromTotal(weight, kgToUnit(perSide.baseKg, unit), perSide.sides)
    : weight;
  const derived = deriveLoad({ mode, value: parseDecimal(value), unit, setting, hands });
  // Off plates, the source's own picture wins (the pin it sat on) — except a
  // dumbbell's count, which is the exercise's, never what an older set chose
  // (`exerciseHands`); a plate row without plates only has the derived one.
  const source: LoadDetail | null =
    fill.load?.kind === 'dumbbell' ? { ...fill.load, hands } : fill.load;
  const load = perSide ? derived : (source ?? derived);
  return { weight, reps, effort: null, load };
};
