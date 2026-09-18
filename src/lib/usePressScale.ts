import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

const DURATION = 110;

/** Press feedback: scale down on press-in, back on release — 110ms linear on the UI thread (reanimated). */
export const usePressScale = (
  to = 0.985,
): { scale: SharedValue<number>; onPressIn: () => void; onPressOut: () => void } => {
  const scale = useSharedValue(1);

  return {
    scale,
    onPressIn: () => {
      scale.value = withTiming(to, { duration: DURATION });
    },
    onPressOut: () => {
      scale.value = withTiming(1, { duration: DURATION });
    },
  };
};
