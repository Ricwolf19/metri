import { Pressable, Text } from 'react-native';

import { ScrollRow } from './ScrollRow';

export type ChipItem<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  items: ChipItem<T>[];
  /** null renders every chip unselected — "you still have to choose". */
  value: T | null;
  onChange: (value: T) => void;
};

/**
 * Single-select row of pill chips (the selected one in brand), scrolling
 * sideways with the shared edge cue when the options overflow.
 */
export const ChipRow = <T extends string>({ items, value, onChange }: Props<T>) => (
  <ScrollRow>
    {items.map((item) => {
      const active = item.value === value;
      return (
        <Pressable
          key={item.value}
          onPress={() => onChange(item.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          className={[
            'shrink-0 rounded-full border px-4 py-2',
            active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
          ].join(' ')}
        >
          <Text
            className={['text-sm font-sans-semibold', active ? 'text-brand' : 'text-ink-300'].join(
              ' ',
            )}
          >
            {item.label}
          </Text>
        </Pressable>
      );
    })}
  </ScrollRow>
);
