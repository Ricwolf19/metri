import { Pressable, Text } from 'react-native';

import { ScrollRow } from './ScrollRow';

export type ChipItem<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  items: ChipItem<T>[];
  /** null renders every chip unselected — "you still have to choose". */
  value: T | null;
  onChange: (value: T) => void;
};

/**
 * Single-select row of pill chips (the selected one in brand), scrolling
 * sideways with the shared edge cue when the options overflow. The live
 * session's exercise strip has its own (`SessionChipStrip`): its chips carry
 * progress states this primitive does not, and it follows the page in view.
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
          // A 36 dp pill; the slop brings the target to 44.
          hitSlop={{ top: 4, bottom: 4 }}
          className={[
            'shrink-0 flex-row items-center rounded-full border px-4 py-2',
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
