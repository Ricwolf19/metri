import { useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  type AccessibilityActionEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { haptic } from '@/lib/haptics';

import { wheelStep } from './wheel-step';

const ITEM_HEIGHT = 44;
const VISIBLE = 5; // odd — selected row sits in the middle
const PAD = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

type Props = {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (n: number) => string;
  /** What the column picks ("Day", "Minutes") — a screen reader names the wheel by it. */
  accessibilityLabel?: string;
};

const A11Y_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }];

/** The colon between two wheels: drawn, never read (each wheel names itself). */
export const WheelSeparator = () => (
  <Text
    importantForAccessibility="no"
    accessibilityElementsHidden
    className="px-2 text-2xl font-sans-bold text-ink-300"
  >
    :
  </Text>
);

/**
 * One column of a wheel. To a screen reader it is ONE adjustable control
 * (swipe up/down steps it, the value is read back) and the rows are hidden: a
 * scroll view of 60 focusable numbers, with no way to tell which one is
 * chosen, is what TalkBack used to walk through.
 */
export const WheelPicker = ({ values, value, onChange, format, accessibilityLabel }: Props) => {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));
  const label = (v: number) => (format ? format(v) : String(v));
  // The row under the band while the wheel moves: each new row ticks, the way
  // a physical detent would. Starts on the chosen row so opening never ticks.
  const row = useRef(index);

  useEffect(() => {
    row.current = index;
    const t = setTimeout(
      () => ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false }),
      0,
    );
    return () => clearTimeout(t);
  }, [index]);

  const rowAt = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(
      values.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)),
    );

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = values[rowAt(e)];
    if (next !== value) onChange(next);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = rowAt(e);
    if (i === row.current) return;
    row.current = i;
    haptic('tick');
  };

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const name = e.nativeEvent.actionName;
    if (name !== 'increment' && name !== 'decrement') return;
    const next = wheelStep(values, value, name === 'increment' ? 1 : -1);
    if (next === value) return;
    haptic('tick');
    onChange(next);
  };

  return (
    <View
      style={{ height: ITEM_HEIGHT * VISIBLE }}
      className="flex-1"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: label(value) }}
      accessibilityActions={A11Y_ACTIONS}
      onAccessibilityAction={onAccessibilityAction}
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: PAD, left: 0, right: 0, height: ITEM_HEIGHT }}
        className="rounded-field border border-brand/40 bg-brand/10"
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        // The wheel always lives inside a scrollable Screen; without this,
        // Android hands the vertical drag to the outer scroll view and the
        // wheel never moves.
        nestedScrollEnabled
        overScrollMode="never"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {values.map((v) => {
          const selected = v === value;
          return (
            <View key={v} style={{ height: ITEM_HEIGHT }} className="items-center justify-center">
              <Text
                className={[
                  selected ? 'text-2xl font-sans-bold text-ink-50' : 'text-lg text-ink-400',
                ].join(' ')}
              >
                {label(v)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};
