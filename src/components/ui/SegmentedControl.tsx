import { Pressable, Text, View } from 'react-native';

import { haptic } from '@/lib/haptics';

import { CONTROL_FONT_SCALE } from './typography';

export type Segment<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  segments: readonly Segment<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** `sm` for a toggle that shares a line with other controls (the session's kg/lb). */
  size?: 'md' | 'sm';
  /** Shown but inert (a calculator input the chosen formula ignores). */
  disabled?: boolean;
};

/** A pill-group selector — used for sex, activity level, units, formula, etc. */
export const SegmentedControl = <T extends string>({
  label,
  segments,
  value,
  onChange,
  size = 'md',
  disabled = false,
}: Props<T>) => {
  const small = size === 'sm';
  return (
    <View className="w-full">
      {label ? (
        <Text
          className={[
            'mb-1.5 font-mono-medium text-xs uppercase tracking-wider',
            disabled ? 'text-ink-500' : 'text-ink-300',
          ].join(' ')}
        >
          {label}
        </Text>
      ) : null}
      {/* `collapsable={false}`: the disabled state dims this track (opacity), and a
          view whose opacity flips between 1 and below 1 stops and starts being a
          stacking context, so Fabric re-hosts the segments between this track and
          its parent — a move Android's mount layer can get wrong when other views
          change in the same commit ("The specified child already has a parent",
          the progress camera's Retake/Use swap). A view that never collapses
          keeps its segments whatever the opacity. */}
      <View
        collapsable={false}
        className={[
          'w-full flex-row rounded-field border border-ink-600 bg-ink-800',
          small ? 'p-0.5' : 'p-1',
          disabled ? 'opacity-40' : '',
        ].join(' ')}
      >
        {segments.map((seg) => {
          const active = seg.value === value;
          return (
            <Pressable
              key={seg.value}
              onPress={() => {
                if (!active) haptic('tick');
                onChange(seg.value);
              }}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              // `sm` stays compact to the eye (it shares a line with other
              // controls) but its target still reaches 44 dp.
              hitSlop={small ? { top: 10, bottom: 10 } : { top: 4, bottom: 4 }}
              className={[
                'flex-1 items-center justify-center rounded-[0.375rem] px-1',
                small ? 'py-1' : 'py-2.5',
                active ? 'bg-ink-50' : 'active:bg-ink-700',
              ].join(' ')}
            >
              {/* Shrink-to-fit on one line so long labels (e.g. "Sedentario",
                  "Muy activo") never wrap mid-word on narrow screens. */}
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={{ textAlign: 'center' }}
                className={[
                  small ? 'text-xs font-sans-semibold' : 'text-sm font-sans-semibold',
                  active ? 'text-ink-900' : 'text-ink-300',
                ].join(' ')}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
