import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { ScrollArea } from './ScrollArea';
import { Sheet } from './Sheet';
import { CONTROL_FONT_SCALE } from './typography';

export type SelectItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  items: readonly SelectItem<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
};

/**
 * Themed dropdown for fields with more options than fit a SegmentedControl
 * (e.g. activity level, MET activity). Trigger mirrors the Input surface and
 * clamps the value to one line; the option list opens in a bottom sheet (labels
 * may wrap there) and hints when it scrolls.
 */
export const Select = <T extends string>({
  label,
  items,
  value,
  onChange,
  placeholder,
}: Props<T>) => {
  const [open, setOpen] = useState(false);
  const { brand, muted } = useTheme();
  const selected = items.find((i) => i.value === value);

  return (
    <View className="w-full">
      {label ? (
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300"
        >
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="min-h-11 w-full flex-row items-center rounded-field border border-ink-600 bg-ink-900 px-4 py-2.5"
      >
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className={['min-w-0 flex-1 text-base', selected ? 'text-ink-50' : 'text-ink-400'].join(
            ' ',
          )}
        >
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <View className="ml-2 shrink-0">
          <ChevronDownIcon color={muted} size={18} />
        </View>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <ScrollArea inSheet>
          {label ? (
            <Text className="mb-1 px-2 font-mono-medium text-xs uppercase tracking-wider text-ink-400">
              {label}
            </Text>
          ) : null}
          {items.map((item) => {
            const active = item.value === value;
            return (
              <Pressable
                key={item.value}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="flex-row items-center justify-between rounded-field px-3 py-3.5 active:bg-ink-700"
              >
                <Text
                  className={[
                    'flex-1 pr-3 text-base',
                    active ? 'font-sans-semibold text-ink-50' : 'text-ink-200',
                  ].join(' ')}
                >
                  {item.label}
                </Text>
                {active ? <CheckIcon color={brand} size={18} /> : null}
              </Pressable>
            );
          })}
        </ScrollArea>
      </Sheet>
    </View>
  );
};
