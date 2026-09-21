import { Text, View } from 'react-native';

import { CONTROL_FONT_SCALE } from './typography';

/**
 * A single headline number with its label above and an optional unit beside it
 * — the building block of the stat rows on Metrics. Flexes to share a row with
 * its siblings, so 2–3 per `<Card className="flex-row">`.
 *
 * Three to a row leaves ~90dp per column, and an uppercase mono label with wide
 * tracking is the widest text the app renders: Spanish labels wrapped to three
 * lines and knocked the values off a shared baseline. The label shrinks to fit
 * instead of wrapping, and the unit never pushes the value out.
 */
export const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <View className="min-w-0 flex-1">
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}
      maxFontSizeMultiplier={CONTROL_FONT_SCALE}
      className="font-mono-medium text-xs uppercase tracking-wider text-ink-400"
    >
      {label}
    </Text>
    <View className="mt-1 min-w-0 flex-row items-baseline">
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className="shrink text-2xl font-sans-bold text-ink-50"
      >
        {value}
      </Text>
      {unit ? (
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="ml-1 shrink-0 text-sm text-ink-400"
        >
          {unit}
        </Text>
      ) : null}
    </View>
  </View>
);
