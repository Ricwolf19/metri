import Body, { type ExtendedBodyPart } from 'react-native-body-highlighter';
import { View } from 'react-native';

import type { Sex } from '@/db/schema';
import { MAP_OUTLINE, UNTRAINED_FILL } from '@/features/training/muscle-colors';
import { HIDDEN_REGIONS, headsForRegion, regionFills } from '@/features/training/body-regions';
import type { MuscleHead } from '@/features/training/muscles';

/**
 * The body figure. `react-native-body-highlighter` (MIT) draws it on
 * react-native-svg, which the app already ships — no native module, so this
 * screen ships over OTA.
 *
 * The library's COMPONENT is deliberately confined to THIS file: it renders a
 * coarser set of regions than metri measures, and nothing outside should have
 * to know that. The head → region mapping lives in `body-regions.ts`, shared
 * with the printed map.
 */

export type BodyMapProps = {
  /** Fill per head. Heads sharing a region resolve to the strongest value. */
  fills: ReadonlyMap<MuscleHead, { color: string; weight: number }>;
  side: 'front' | 'back';
  sex: Sex | null;
  onPressRegion?: (heads: MuscleHead[]) => void;
  scale?: number;
};

/** The library's parts: one per region, coloured by its strongest head (`regionFills`). */
const toParts = (fills: BodyMapProps['fills']): ExtendedBodyPart[] =>
  [...regionFills(fills)].map(([slug, color]) => ({ slug, color }));

export const BodyMap = ({ fills, side, sex, onPressRegion, scale = 1 }: BodyMapProps) => {
  return (
    <View className="items-center">
      <Body
        data={toParts(fills)}
        side={side}
        // The figure is anatomical, and the library offers exactly two. A user
        // who has not said falls back to one rather than losing the screen.
        gender={sex === 'female' ? 'female' : 'male'}
        scale={scale}
        // An outline + a fill light enough to separate from the near-black
        // page: without both, an untrained figure is invisible (it is the
        // default state of the screen, so it has to read first).
        border={MAP_OUTLINE}
        hiddenParts={HIDDEN_REGIONS}
        defaultFill={UNTRAINED_FILL}
        onBodyPartPress={(part) => {
          if (part.slug) onPressRegion?.(headsForRegion(part.slug));
        }}
      />
    </View>
  );
};
