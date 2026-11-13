import { useState, type ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { IconProps } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { ScrollRow } from './ScrollRow';
import { CONTROL_FONT_SCALE } from './typography';

export type ChoiceCard<T extends string> = {
  value: T;
  label: string;
  /** One short line under the label: what picking this card shows. */
  caption: string;
  Icon: ComponentType<IconProps>;
};

type Props<T extends string> = {
  items: readonly ChoiceCard<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Wide enough for "Strength" plus a two-line caption in Spanish; three cards
 * overflow a phone on purpose, so the edge cue says there is more. */
const CARD_WIDTH = 148;

/**
 * Single-select row of small cards (icon, label, a one-line caption) that
 * scrolls sideways — for a choice between a few MODES whose names alone do not
 * say what they show (the body map's balance / fatigue / strength). Plain
 * options are a `ChipRow`; two or three short values a `SegmentedControl`.
 * The selected card is lime and is kept in view.
 */
export const ChoiceCarousel = <T extends string>({ items, value, onChange }: Props<T>) => {
  const theme = useTheme();
  const [lefts, setLefts] = useState<Partial<Record<T, number>>>({});
  const left = lefts[value];
  return (
    <ScrollRow focusX={left == null ? undefined : left + CARD_WIDTH / 2}>
      {items.map(({ value: v, label, caption, Icon }) => {
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            onLayout={(e) => {
              const x = e.nativeEvent.layout.x;
              setLefts((prev) => (prev[v] === x ? prev : { ...prev, [v]: x }));
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${label}. ${caption}`}
            style={{ width: CARD_WIDTH }}
            className={[
              'min-h-[72px] rounded-2xl border px-3.5 py-3',
              active
                ? 'border-brand/50 bg-brand/15'
                : 'border-ink-700 bg-ink-800 active:bg-ink-700',
            ].join(' ')}
          >
            <View className="flex-row items-center gap-2">
              <Icon color={active ? theme.brand : theme.muted} size={16} strokeWidth={2.2} />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className={[
                  'min-w-0 flex-1 text-sm font-sans-semibold',
                  active ? 'text-brand' : 'text-ink-100',
                ].join(' ')}
              >
                {label}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="mt-1 text-xs leading-4 text-ink-300"
            >
              {caption}
            </Text>
          </Pressable>
        );
      })}
    </ScrollRow>
  );
};
