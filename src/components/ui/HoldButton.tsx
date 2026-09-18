import { useState } from 'react';
import { Pressable, Text, View, type AccessibilityActionEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useT } from '@/i18n';

type Variant = 'danger' | 'secondary';
type Size = 'sm' | 'md';

type Props = {
  label?: string;
  /** Chip mode (40×40) for a delete inside a list row; omit `label`. */
  icon?: React.ReactNode;
  onComplete: () => void;
  variant?: Variant;
  size?: Size;
  durationMs?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const HOLD_MS = 900;

const CONTAINER: Record<Variant, string> = {
  danger: 'border border-red-500/40 bg-red-500/10',
  secondary: 'border border-ink-600/70 bg-ink-800/90',
};
const FILL: Record<Variant, string> = { danger: 'bg-red-500/30', secondary: 'bg-ink-600/60' };
const LABEL: Record<Variant, string> = { danger: 'text-red-400', secondary: 'text-ink-50' };
const SIZE_BOX: Record<Size, string> = { sm: 'min-h-9 px-3.5 py-1.5', md: 'min-h-11 px-5 py-2.5' };

// Fill is visual only; firing is Pressable's long-press detector, so tap bursts can't complete it.
// Shared-value writes stay in a module-scope factory (AGENTS.md#architecture-invariants).
const makeFillController = (progress: SharedValue<number>, durationMs: number) => ({
  start: () => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.linear });
  },
  reset: () => {
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 140 });
  },
});

/**
 * Press-and-hold confirmation for irreversible actions: the fill grows for
 * `durationMs`, releasing early cancels, completing fires once. Screen readers
 * get an `activate` action so they never have to hold.
 */
export const HoldButton = ({
  label,
  icon,
  onComplete,
  variant = 'danger',
  size = 'md',
  durationMs = HOLD_MS,
  disabled,
  accessibilityLabel,
}: Props) => {
  const t = useT();
  const progress = useSharedValue(0);
  const [fill] = useState(() => makeFillController(progress, durationMs));

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const complete = () => {
    fill.reset();
    onComplete();
  };
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') onComplete();
  };

  const chip = !label && !!icon;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={fill.start}
      onPressOut={fill.reset}
      onLongPress={complete}
      delayLongPress={durationMs}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={t('common.holdHint')}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onAccessibilityAction}
      className={[
        'relative items-center justify-center overflow-hidden',
        chip ? 'h-10 w-10 rounded-full' : `w-full rounded-field ${SIZE_BOX[size]}`,
        CONTAINER[variant],
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: 0, bottom: 0 }, fillStyle]}
      >
        <View className={`h-full w-full ${FILL[variant]}`} />
      </Animated.View>
      {chip ? (
        icon
      ) : (
        <Text className={['text-sm font-sans-semibold', LABEL[variant]].join(' ')}>{label}</Text>
      )}
    </Pressable>
  );
};
