import { useState } from 'react';
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useTheme } from '@/theme/theme-context';

import { UnitSuffix } from './UnitSuffix';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  unitLabel: string;
  keyboardType: KeyboardTypeOptions;
  maxLength: number;
  accessibilityLabel: string;
  /** Leaving the field: the row snaps the typed number onto the rack here. */
  onBlur?: () => void;
};

/**
 * A set row's number field: the value on the left, its unit in a fixed box on
 * the right, so weight and reps share one size and read the same. The number
 * gets the whole field (a per-side prefix in front of it clipped "132.5" on a
 * phone). No placeholder: the row's header already names the target ("SET 1 |
 * 12 REPS @ RIR 2"), and a grey "0" or "12" read as a value already entered.
 */
export const SetInput = ({
  value,
  onChangeText,
  unitLabel,
  keyboardType,
  maxLength,
  accessibilityLabel,
  onBlur,
}: Props) => {
  const { textSelection } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      className={[
        'min-h-12 flex-row items-stretch overflow-hidden rounded-field border bg-ink-900',
        focused ? 'border-brand/60' : 'border-ink-500',
      ].join(' ')}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        {...textSelection}
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
        <UnitSuffix label={unitLabel} />
      </View>
    </View>
  );
};
