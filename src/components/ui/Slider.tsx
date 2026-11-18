import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const THUMB = 24;

type Props = {
  /** 0 … 1. */
  value: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  /** What a screen reader hears for the value ("35 %"). */
  valueText: (value: number) => string;
  /** One screen-reader increment. */
  step?: number;
  className?: string;
};

/**
 * A horizontal 0–1 slider: a lime fill on an ink track with a round thumb. A
 * tap jumps there, a sideways drag follows the finger, a vertical drag fails
 * so the screen still scrolls. Continuous, so no haptic per step. Screen
 * readers adjust it by `step` (role `adjustable`).
 */
export const Slider = ({
  value,
  onChange,
  accessibilityLabel,
  valueText,
  step = 0.1,
  className = '',
}: Props) => {
  const [width, setWidth] = useState(0);
  const at = (x: number) => {
    if (width > 0) onChange(clamp01((x - THUMB / 2) / (width - THUMB)));
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((e) => at(e.x))
    .onUpdate((e) => at(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, success) => {
      if (success) at(e.x);
    });
  const travel = Math.max(0, width - THUMB);
  const left = clamp01(value) * travel;

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: valueText(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onChange(clamp01(value + (e.nativeEvent.actionName === 'increment' ? step : -step)))
        }
        className={`min-h-11 justify-center ${className}`}
      >
        <View className="mx-3 h-1 rounded-full bg-ink-700">
          <View className="h-1 rounded-full bg-brand" style={{ width: left }} />
        </View>
        <View
          pointerEvents="none"
          className="absolute rounded-full border-2 border-ink-950 bg-brand"
          style={{ left, width: THUMB, height: THUMB }}
        />
      </View>
    </GestureDetector>
  );
};
