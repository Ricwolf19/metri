import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useTheme } from '@/theme/theme-context';

import type { Trend } from '../set-prefill';
import { TrendArrow } from './TrendArrow';
import { UnitSuffix } from './UnitSuffix';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  unitLabel: string;
  placeholder?: string;
  keyboardType: KeyboardTypeOptions;
  maxLength: number;
  accessibilityLabel: string;
  /** Against the same set of the previous session; drawn above the unit. */
  trend?: Trend | null;
  /** Leaving the field: the row snaps the typed number onto the rack here. */
  onBlur?: () => void;
};

/**
 * A set row's number field: the value on the left, its unit in a fixed box on
 * the right, so weight and reps share one size and read the same. The trend
 * arrow sits above the unit inside that box, never beside the number: the
 * number gets the whole field (a per-side prefix and an arrow in front of it
 * clipped "132.5" on a phone).
 */
export const SetInput = ({
  value,
  onChangeText,
  unitLabel,
  placeholder,
  keyboardType,
  maxLength,
  accessibilityLabel,
  trend = null,
  onBlur,
}: Props) => {
  const { brand, muted } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={[
        'min-h-12 flex-row items-stretch overflow-hidden rounded-field border bg-ink-900',
        focused ? 'border-brand/60' : 'border-ink-600',
      ].join(' ')}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={muted}
        selectionColor={brand}
        accessibilityLabel={accessibilityLabel}
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        className="min-w-0 flex-1 px-2.5 py-2 text-base tabular-nums text-ink-50"
      />
      <View className="items-center justify-center border-l border-ink-700 bg-ink-850 px-2">
        <TrendArrow trend={trend} />
        <UnitSuffix label={unitLabel} />
      </View>
    </View>
  );
};
