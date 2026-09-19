import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import { View } from 'react-native';

import type { Sex } from '@/db/schema';
import { MUSCLE_HEADS, type MuscleHead } from '@/features/training/muscles';
import { useTheme } from '@/theme/theme-context';

/**
 * The body figure. `react-native-body-highlighter` (MIT) draws it on
 * react-native-svg, which the app already ships — no native module, so this
 * screen ships over OTA.
 *
 * The library is deliberately confined to THIS file: it renders a coarser set
 * of regions than metri measures, and nothing outside should have to know that.
 */

/**
 * Canonical head → the region the figure can actually draw.
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
const HIDDEN: Slug[] = ['hair', 'head', 'hands', 'feet', 'ankles', 'neck', 'knees', 'tibialis'];

/** Every head drawn by a region, for the tap handler and the drilldown. */
const headsForRegion = (region: Slug): MuscleHead[] =>
  MUSCLE_HEADS.filter((head) => HEAD_TO_REGION[head] === region);

export type BodyMapProps = {
  /** Fill per head. Heads sharing a region resolve to the strongest value. */
  fills: ReadonlyMap<MuscleHead, { color: string; weight: number }>;
  side: 'front' | 'back';
  sex: Sex | null;
  onPressRegion?: (heads: MuscleHead[]) => void;
  scale?: number;
};

/**
 * A region shows the fill of its most-loaded head: with one `deltoids` shape
 * for three heads, the worst/strongest signal is the one worth surfacing —
 * averaging would hide exactly the imbalance the map exists to reveal.
 */
const toParts = (fills: BodyMapProps['fills']): ExtendedBodyPart[] => {
  const strongest = new Map<Slug, { color: string; weight: number }>();
  for (const [head, fill] of fills) {
    const region = HEAD_TO_REGION[head];
    const current = strongest.get(region);
    if (!current || fill.weight > current.weight) strongest.set(region, fill);
  }
  return [...strongest.entries()].map(([slug, fill]) => ({ slug, color: fill.color }));
};

export const BodyMap = ({ fills, side, sex, onPressRegion, scale = 1 }: BodyMapProps) => {
  const { scheme } = useTheme();

  return (
    <View className="items-center">
      <Body
        data={toParts(fills)}
        side={side}
        // The figure is anatomical, and the library offers exactly two. A user
        // who has not said falls back to one rather than losing the screen.
        gender={sex === 'female' ? 'female' : 'male'}
        scale={scale}
        border="none"
        hiddenParts={HIDDEN}
        defaultFill={scheme === 'dark' ? '#27272a' : '#e4e4e7'}
        onBodyPartPress={(part) => {
          if (part.slug) onPressRegion?.(headsForRegion(part.slug));
        }}
      />
    </View>
  );
};
