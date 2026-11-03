import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { deriveLoad, kgToUnit, seedFromPlates, type LoadDetail, type RowInputMode } from './load';
import { sideFieldFromTotal } from './plate-math';
import { weightText } from './set-prefill';
import type { RowDraft } from './workout-drafts';

/** What `nextSetPrefill` hands the row: the number, the reps and how it was built. */
type Fill = { weightKg: number | null; reps: number; load: LoadDetail | null };

/**
 * A lift that holds ONE dumbbell in both hands (`holdsOneDumbbell`) reopens on
 * one, whatever an older set recorded: builds before that fact defaulted every
 * dumbbell lift to a pair, and a pair would keep doubling its volume.
 */
export const oneDumbbellFill = (fill: Fill): Fill =>
  fill.load?.kind === 'dumbbell' ? { ...fill, load: { ...fill.load, hands: 1 } } : fill;

/**
 * The draft a live row opens with, from its prefill — set 1 from the previous
 * session, later sets from the set just logged. The picture always travels
 * with the number: a plate-loaded row opens on the SAME plates (the side and
 * the total follow them, `seedFromPlates`), and when the source carried no
 * picture (a set logged before plates existed, a plain total) one is derived
 * for this row's mode — plates split onto the rack, a total on its pin, one
 * dumbbell with its hands — so the picker field and the load sheet never open
 * on a bare number the rack cannot show.
 */
export const seedRow = (input: {
  fill: Fill;
  mode: RowInputMode;
  unit: Units;
  /** The exercise's saved load config (bar, sled, stack). */
  setting: LoadDetail | null | undefined;
  unilateral: boolean | undefined;
}): RowDraft => {
  const { fill, mode, unit, setting, unilateral } = input;
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
  const derived = deriveLoad({
    mode,
    value: parseDecimal(value),
    unit,
    setting,
    current: fill.load,
    unilateral,
  });
  // Off plates, the source's own picture wins (the pin it sat on, two
  // dumbbells); a plate row without plates only has the derived one.
  const load = perSide ? derived : (fill.load ?? derived);
  return { weight, reps, effort: null, load };
};
