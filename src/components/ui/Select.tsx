import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

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
 * (e.g. activity level, MET activity). Trigger mirrors the Input surface; the
 * option list opens in a bottom sheet.
 */
export const Select = <T extends string>({
  label,
  items,
  value,
  onChange,
  placeholder,
}: Props<T>) => {
  const [open, setOpen] = useState(false);
  const { brand } = useTheme();
  const selected = items.find((i) => i.value === value);

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="h-11 w-full flex-row items-center justify-between rounded-field border border-ink-600 bg-ink-900 px-4"
      >
        <Text className={selected ? 'text-base text-ink-50' : 'text-base text-ink-400'}>
          {selected?.label ?? placeholder ?? ''}
        </Text>
        <ChevronDownIcon color="#71717a" size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/60"
          accessibilityRole="button"
        >
          <Pressable className="rounded-t-card border-t border-ink-600 bg-ink-800 px-4 pb-8 pt-3">
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-ink-600" />
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
                      'text-base',
                      active ? 'font-sans-semibold text-ink-50' : 'text-ink-200',
                    ].join(' ')}
                  >
                    {item.label}
                  </Text>
                  {active ? <CheckIcon color={brand} size={18} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
