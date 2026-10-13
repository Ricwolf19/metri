import { useState } from 'react';
import { Pressable, Text, type LayoutChangeEvent } from 'react-native';

import { ScrollRow } from './ScrollRow';

export type ChipItem<T extends string> = {
  value: T;
  label: string;
  /** Finished (an exercise with every set logged): `info` tone, so the row reads as progress. */
  done?: boolean;
};

type Props<T extends string> = {
  items: ChipItem<T>[];
  /** null renders every chip unselected — "you still have to choose". */
  value: T | null;
  onChange: (value: T) => void;
  /**
   * Keep the selected chip in view when the selection changes from outside the
   * row (Prev/Next, a deep link): for a strip that doubles as the navigation.
   */
  followSelection?: boolean;
};

type Box = { x: number; width: number };

/**
 * Single-select row of pill chips (the selected one in brand), scrolling
 * sideways with the shared edge cue when the options overflow.
 */
export const ChipRow = <T extends string>({
  items,
  value,
  onChange,
  followSelection,
}: Props<T>) => {
  const [boxes, setBoxes] = useState<ReadonlyMap<T, Box>>(new Map());
  const place = (chip: T) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setBoxes((prev) => {
      const seen = prev.get(chip);
      if (seen && seen.x === x && seen.width === width) return prev;
      return new Map(prev).set(chip, { x, width });
    });
  };
  const selected = followSelection && value != null ? boxes.get(value) : undefined;
  return (
    <ScrollRow focusX={selected ? selected.x + selected.width / 2 : undefined}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            onLayout={followSelection ? place(item.value) : undefined}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={[
              'shrink-0 rounded-full border px-4 py-2',
              active
                ? 'border-brand/40 bg-brand/15'
                : item.done
                  ? 'border-info/30 bg-info/10'
                  : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <Text
              className={[
                'text-sm font-sans-semibold',
                active ? 'text-brand' : item.done ? 'text-info' : 'text-ink-300',
              ].join(' ')}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollRow>
  );
};
