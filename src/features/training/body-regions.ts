import type { Slug } from 'react-native-body-highlighter';

import { MUSCLE_HEADS, type MuscleHead } from './muscles';

/**
 * How metri's muscle heads land on the regions the body figure can draw. Pure,
 * so the on-screen map (`components/BodyMap.tsx`) and the printed one
 * (`features/print/figure.ts`) collapse heads the same way.
 *
 * The figure has one `deltoids`, one `chest` and no lats/mid-back split, so
 * several heads collapse onto the same region. Analytics keep full resolution;
 * only the drawing aggregates, and tapping a region opens the breakdown.
 */
const HEAD_TO_REGION: Record<MuscleHead, Slug> = {
  chest: 'chest',
  upper_chest: 'chest',
  lats: 'upper-back',
  mid_back: 'upper-back',
  lower_back: 'lower-back',
  traps: 'trapezius',
  front_delts: 'deltoids',
  side_delts: 'deltoids',
  rear_delts: 'deltoids',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearm',
  abs: 'abs',
  obliques: 'obliques',
  quads: 'quadriceps',
  hamstrings: 'hamstring',
  glutes: 'gluteal',
  adductors: 'adductors',
  calves: 'calves',
};

/** Regions the figure draws that no exercise can train — never shown. */
export const HIDDEN_REGIONS: Slug[] = [
  'hair',
  'head',
  'hands',
  'feet',
  'ankles',
  'neck',
  'knees',
  'tibialis',
];

/** Every head drawn by a region, for the tap handler and the drilldown. */
export const headsForRegion = (region: Slug): MuscleHead[] =>
  MUSCLE_HEADS.filter((head) => HEAD_TO_REGION[head] === region);

/**
 * A region shows the fill of its most-loaded head: with one `deltoids` shape
 * for three heads, the worst/strongest signal is the one worth surfacing —
 * averaging would hide exactly the imbalance the map exists to reveal.
 */
export const regionFills = (
  fills: ReadonlyMap<MuscleHead, { color: string; weight: number }>,
): Map<Slug, string> => {
  const strongest = new Map<Slug, { color: string; weight: number }>();
  for (const [head, fill] of fills) {
    const region = HEAD_TO_REGION[head];
    const current = strongest.get(region);
    if (!current || fill.weight > current.weight) strongest.set(region, fill);
  }
  return new Map([...strongest].map(([slug, fill]) => [slug, fill.color]));
};
