import { useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE = 5; // odd — selected row sits in the middle
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

type Props = {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (n: number) => string;
};

/**
 * A single snapping scroll column (Apple-style wheel). The selected value is the
 * one centered in the highlight band; scrolling snaps to whole rows.
 */
export const WheelPicker = ({ values, value, onChange, format }: Props) => {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));

  // Center the current value on mount.
  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false }),
      0,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const next = values[Math.min(values.length - 1, Math.max(0, i))];
    if (next !== value) onChange(next);
  };

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE }} className="flex-1">
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: PAD, left: 0, right: 0, height: ITEM_HEIGHT }}
        className="rounded-xl border border-lime-400/40 bg-lime-400/10"
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
      >
        {values.map((v) => {
          const selected = v === value;
          return (
            <View key={v} style={{ height: ITEM_HEIGHT }} className="items-center justify-center">
              <Text
                className={[
                  selected ? 'text-2xl font-bold text-ink-50' : 'text-lg text-ink-400',
                ].join(' ')}
              >
                {format ? format(v) : String(v)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
