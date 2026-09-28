import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useTheme } from '@/theme/theme-context';

import { UnitSuffix } from './UnitSuffix';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  unitLabel: string;
  placeholder?: string;
  keyboardType: KeyboardTypeOptions;
  maxLength: number;
  accessibilityLabel: string;
};

/**
 * A set row's number field: the value on the left, its unit in a fixed box on
 * the right, so weight and reps share one size and read the same. Compact on
 * purpose — two of these, the calculator and the check share a phone-width row,
 * which the general `Input` (wide padding, label slot) cannot fit.
 */
export const SetInput = ({
  value,
  onChangeText,
  unitLabel,
  placeholder,
  keyboardType,
  maxLength,
  accessibilityLabel,
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
        onBlur={() => setFocused(false)}
        className="min-w-0 flex-1 px-2.5 py-2 text-base tabular-nums text-ink-50"
      />
      <View className="justify-center border-l border-ink-700 bg-ink-850 px-2">
        <UnitSuffix label={unitLabel} />
      </View>
    </View>
  );
};
