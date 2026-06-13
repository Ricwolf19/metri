import { Pressable, Text, View } from 'react-native';

export type Segment<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  segments: readonly Segment<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** A pill-group selector — used for sex, activity level, units, formula, etc. */
export const SegmentedControl = <T extends string>({
  label,
  segments,
  value,
  onChange,
}: Props<T>) => {
  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}
      <View className="w-full flex-row rounded-xl border border-ink-600 bg-ink-800 p-1">
        {segments.map((seg) => {
          const active = seg.value === value;
          return (
            <Pressable
              key={seg.value}
              onPress={() => onChange(seg.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={[
                'flex-1 items-center justify-center rounded-lg py-2.5',
                active ? 'bg-lime-400' : 'active:bg-ink-700',
              ].join(' ')}
            >
              <Text
                className={['text-sm font-semibold', active ? 'text-ink-950' : 'text-ink-300'].join(
                  ' ',
                )}
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
