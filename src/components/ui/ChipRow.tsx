import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { DragHandleIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { ScrollRow } from './ScrollRow';

export type ChipItem<T extends string> = {
  value: T;
  label: string;
  /** Finished (an exercise with every set logged): `info` tone, so the row reads as progress. */
  done?: boolean;
  /** Skipped (an exercise the lifter marked missed): the adherence red, so the row reads as a gap. */
  missed?: boolean;
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
  /** Edge chevrons; false when the row sits between its own paging arrows. */
  cues?: boolean;
  /** A hold on a chip; the caller decides what that means (the session lifts it to reorder). */
  onLongPress?: (value: T) => void;
  /** Hint read with every chip when a hold does something. */
  longPressHint?: string;
  /** The chip picked up by a hold: dashed brand outline with a grip, until it is tapped again. */
  lifted?: T | null;
};

type Box = { x: number; width: number };

/**
 * Single-select row of pill chips (the selected one in brand), scrolling
 * sideways with the shared edge cue when the options overflow. A `lifted`
 * chip is the one a hold picked up: it keeps the selected look plus a dashed
 * outline and a grip, so the row says "this one moves" without a modal.
 */
export const ChipRow = <T extends string>({
  items,
  value,
  onChange,
  followSelection,
  cues,
  onLongPress,
  longPressHint,
  lifted = null,
}: Props<T>) => {
  const { brand } = useTheme();
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
    <ScrollRow focusX={selected ? selected.x + selected.width / 2 : undefined} cues={cues}>
      {items.map((item) => {
        const active = item.value === value;
        const isLifted = item.value === lifted;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            onLongPress={onLongPress ? () => onLongPress(item.value) : undefined}
            onLayout={followSelection ? place(item.value) : undefined}
            accessibilityRole="button"
            accessibilityHint={onLongPress ? longPressHint : undefined}
            accessibilityState={{ selected: active }}
            className={[
              'shrink-0 flex-row items-center gap-1.5 rounded-full border px-4 py-2',
              isLifted
                ? 'border-dashed border-brand bg-brand/25'
                : active
                  ? 'border-brand/40 bg-brand/15'
                  : item.missed
                    ? 'border-red-500/40 bg-red-500/10'
                    : item.done
                      ? 'border-info/30 bg-info/10'
                      : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            {isLifted ? (
              <View className="-ml-1">
                <DragHandleIcon color={brand} size={14} />
              </View>
            ) : null}
            <Text
              className={[
                'text-sm font-sans-semibold',
                active
                  ? 'text-brand'
                  : item.missed
                    ? 'text-red-400'
                    : item.done
                      ? 'text-info'
                      : 'text-ink-300',
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
