import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

/** The one bottom-sheet primitive: scrim fade + short ease-out rise (motion rules: AGENTS.md#conventions). */
export const Sheet = ({ visible, onClose, children, className }: Props) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible
      ? withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
      : 0;
  }, [progress, visible]);

  const rise = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [24, 0]) }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/60"
        onPress={onClose}
        accessibilityRole="button"
      >
        <Animated.View style={rise}>
          <Pressable
            className={[
              'rounded-t-sheet border-t border-ink-700 bg-ink-900 px-5 pb-8 pt-4',
              className ?? '',
            ].join(' ')}
            onPress={() => {}}
          >
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-ink-600" />
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
