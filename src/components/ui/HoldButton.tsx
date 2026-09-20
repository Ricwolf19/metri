import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useT } from '@/i18n';
import { THEME_VARS } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-context';

import { CONTROL_FONT_SCALE } from './typography';

type Variant = 'danger' | 'secondary';
type Size = 'sm' | 'md';

type Props = {
  label?: string;
  /** Chip mode (40×40) for a delete inside a list row; omit `label`. */
  icon?: React.ReactNode;
  /** A returned promise keeps the button in its loader state until it settles. */
  onComplete: () => void | Promise<unknown>;
  variant?: Variant;
  size?: Size;
  durationMs?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const HOLD_MS = 900;
// Lets the loader frame paint before the (possibly heavy, synchronous) action runs.
const PAINT_MS = 50;

const CONTAINER: Record<Variant, string> = {
  danger: 'border border-red-500/40 bg-red-500/10',
  secondary: 'border border-ink-600/70 bg-ink-800/90',
};
/** Once the hold completes the control vanishes; only the loader stays in its place. */
const BUSY = 'border border-transparent bg-transparent';
const FILL: Record<Variant, string> = { danger: 'bg-red-500/30', secondary: 'bg-ink-600/60' };
const LABEL: Record<Variant, string> = { danger: 'text-red-400', secondary: 'text-ink-50' };
const HEIGHT: Record<Size, number> = { sm: 36, md: 44 };

// Fill is visual only; firing is Pressable's long-press detector, so tap bursts can't complete it.
// Shared-value writes stay in a module-scope factory (AGENTS.md#architecture-invariants).
const makeController = (progress: SharedValue<number>, durationMs: number) => ({
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
 * `durationMs`, releasing early cancels, completing fires once. On completion
 * the control disappears and a loader takes its place until the action settles,
 * so the screen never shows a button that is not accepting input. Screen readers
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
  const { scheme } = useTheme();
  const progress = useSharedValue(0);
  const [busy, setBusy] = useState(false);
  const [ctl] = useState(() => makeController(progress, durationMs));

  const chip = !label && !!icon;
  const height = chip ? 40 : HEIGHT[size];
  // Danger keeps the destructive red through the loader; secondary follows the theme.
  const spinner = variant === 'danger' ? '#ef4444' : `rgb(${THEME_VARS[scheme]['--ink-50']})`;

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const complete = () => {
    if (busy) return;
    ctl.reset();
    setBusy(true);
    setTimeout(() => {
      const result = onComplete();
      if (result instanceof Promise) void result.finally(() => setBusy(false));
      else setBusy(false);
    }, PAINT_MS);
  };
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') complete();
  };

  return (
    <View
      style={{ height }}
      className={[
        'relative items-center justify-center overflow-hidden',
        chip ? 'w-10 rounded-full' : 'w-full rounded-field',
        busy ? BUSY : CONTAINER[variant],
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      <Pressable
        disabled={disabled || busy}
        onPressIn={ctl.start}
        onPressOut={ctl.reset}
        onLongPress={complete}
        delayLongPress={durationMs}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={t('common.holdHint')}
        accessibilityState={{ disabled: !!disabled || busy }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={onAccessibilityAction}
        className="h-full w-full items-center justify-center px-4"
      >
        {busy ? null : (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: 0, top: 0, bottom: 0 }, fillStyle]}
          >
            <View className={`h-full w-full ${FILL[variant]}`} />
          </Animated.View>
        )}
        {busy ? (
          <ActivityIndicator size="small" color={spinner} />
        ) : chip ? (
          icon
        ) : (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className={['text-sm font-sans-semibold', LABEL[variant]].join(' ')}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </View>
  );
};
