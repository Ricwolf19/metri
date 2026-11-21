import { Text } from 'react-native';

import { CONTROL_FONT_SCALE } from './typography';

/** The unit a number is measured in (KG, LB, CM, REPS), set beside the value so
 * an input never leaves anyone guessing which scale they are typing in. */
export const UnitSuffix = ({ label }: { label: string }) => (
  <Text
    maxFontSizeMultiplier={CONTROL_FONT_SCALE}
    className="font-mono-medium text-[11px] uppercase tracking-wider text-ink-400"
  >
    {label}
  </Text>
);
