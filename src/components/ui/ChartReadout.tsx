import { Text, View } from 'react-native';

import { CONTROL_FONT_SCALE } from './typography';

/**
 * The line above a chart that says what the finger is on: the value with its
 * unit, and under it which series and when. Always two lines (the caption
 * keeps its line even when empty), so scrubbing never moves the plot.
 */
export const ChartReadout = ({
  value,
  unit,
  caption,
}: {
  value: string;
  unit?: string;
  caption?: string;
}) => (
  <View className="mb-2">
    <View className="min-w-0 flex-row items-baseline">
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className="shrink text-xl font-sans-bold text-ink-50"
      >
        {value}
      </Text>
      {unit ? (
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="ml-1 shrink-0 text-xs text-ink-400"
        >
          {unit}
        </Text>
      ) : null}
    </View>
    <Text
      numberOfLines={1}
      maxFontSizeMultiplier={CONTROL_FONT_SCALE}
      className="mt-0.5 text-xs text-ink-400"
    >
      {caption || ' '}
    </Text>
  </View>
);
