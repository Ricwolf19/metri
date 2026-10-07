import { Pressable, Text, View } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { Units } from '@/lib/storage';

/**
 * The pins of a stack, one pill each, selected in brand. Wraps on purpose —
 * the one strip in the app that does: this is a single-select PICKER for
 * finding a close quantity at a glance (24 pins in a scrolling line hide the
 * one you want), not a badge strip, and it lives inside a sheet that scrolls.
 */
export const MachineLoadGrid = ({
  loads,
  unit,
  selected,
  onSelect,
}: {
  loads: number[];
  unit: Units;
  selected: number | null;
  onSelect: (index: number) => void;
}) => {
  if (!loads.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2">
      {loads.map((load, i) => {
        const active = selected === i;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${load} ${unit}`}
            className={[
              'min-h-11 min-w-16 items-center justify-center rounded-full border px-3',
              active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className={[
                'text-sm font-sans-semibold tabular-nums',
                active ? 'text-brand' : 'text-ink-300',
              ].join(' ')}
            >
              {load}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
