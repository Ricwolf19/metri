import { useState, type ReactNode } from 'react';
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
  /** A small indicator before the value (the trend arrow); nothing by default. */
  leading?: ReactNode;
  /** Leaving the field: the row snaps the typed number onto the rack here. */
  onBlur?: () => void;
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
  leading,
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
      {leading}
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
        className={[
          'min-w-0 flex-1 py-2 text-base tabular-nums text-ink-50',
          // A prefix ("20 +") already pads the left: the value sits right after it.
          leading ? 'pl-1 pr-2.5' : 'px-2.5',
        ].join(' ')}
      />
      <View className="justify-center border-l border-ink-700 bg-ink-850 px-2">
        <UnitSuffix label={unitLabel} />
      </View>
    </View>
  );
};
