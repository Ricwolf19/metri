import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { OptionSheet } from './OptionSheet';
import { CONTROL_FONT_SCALE } from './typography';

export type SelectItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  items: readonly SelectItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
  /** Shown but inert (a calculator input the chosen formula ignores). */
  disabled?: boolean;
};

/**
 * Themed dropdown for fields with more options than fit a SegmentedControl
 * (e.g. activity level, MET activity). Trigger mirrors the Input surface and
 * clamps the value to one line; the option list is an `OptionSheet`.
 */
export const Select = <T extends string>({
  label,
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: Props<T>) => {
  const [open, setOpen] = useState(false);
  const { muted } = useTheme();
  const selected = items.find((i) => i.value === value);

  return (
    <View className="w-full">
      {label ? (
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className={[
            'mb-1.5 font-mono-medium text-xs uppercase tracking-wider',
            disabled ? 'text-ink-500' : 'text-ink-300',
          ].join(' ')}
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        className={[
          'min-h-11 w-full flex-row items-center rounded-field border px-4 py-2.5',
          disabled ? 'border-ink-700 bg-ink-850' : 'border-ink-500 bg-ink-900',
        ].join(' ')}
      >
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className={[
            'min-w-0 flex-1 text-base',
            selected && !disabled ? 'text-ink-50' : 'text-ink-400',
          ].join(' ')}
        >
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <View className="ml-2 shrink-0">
          <ChevronDownIcon color={muted} size={18} />
        </View>
      </Pressable>

      <OptionSheet
        visible={open}
        onClose={() => setOpen(false)}
        label={label}
        items={items}
        value={value}
        onChange={onChange}
      />
    </View>
  );
};
