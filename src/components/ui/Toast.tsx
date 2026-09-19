import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CheckIcon,
  ChevronRightIcon,
  InfoCircleIcon,
  WarningIcon,
  type IconProps,
} from '@/components/icons';
import { useT } from '@/i18n';
import { HEADER_PILL_BOTTOM } from './Screen';
import { useTheme } from '@/theme/theme-context';

type ToastType = 'success' | 'error' | 'info';
type ToastAction = { label: string; onPress: () => void };
type ToastOptions = {
  action?: ToastAction;
  /** No auto-dismiss: stays until swiped away or tapped (critical messages). */
  sticky?: boolean;
};
type Toast = {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
  sticky?: boolean;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType, opts?: ToastOptions) => void;
  success: (message: string, opts?: ToastOptions) => void;
  error: (message: string, opts?: ToastOptions) => void;
  info: (message: string, opts?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

// Notification-like: long enough to read and act on; swipe dismisses sooner.
const DURATION_MS = 7_500;

// Swipe-release thresholds: distance or flick velocity dismisses.
const DISMISS_DX = 80;
const DISMISS_VX = 800;

const SURFACE: Record<ToastType, string> = {
  success: 'border-brand/40 bg-ink-800',
  error: 'border-red-500/40 bg-ink-800',
  info: 'border-ink-500 bg-ink-800',
};

const CHIP: Record<ToastType, string> = {
  success: 'bg-brand/15',
  error: 'bg-red-500/15',
  info: 'bg-ink-600/40',
};

const LIFE_BAR: Record<ToastType, string> = {
  success: 'bg-brand',
  error: 'bg-red-400',
  info: 'bg-ink-400',
};

const ICON: Record<ToastType, React.ComponentType<IconProps>> = {
  success: CheckIcon,
  error: WarningIcon,
  info: InfoCircleIcon,
};

// Timers, shared-value writes and the pan gesture live in a module-scope factory
// (React Compiler rule — AGENTS.md#architecture-invariants, Animations).
const makeToastController = (opts: {
  anim: SharedValue<number>;
  life: SharedValue<number>;
  panX: SharedValue<number>;
  width: number;
  sticky: boolean;
  dismiss: () => void;
}) => {
  const { anim, life, panX, width, sticky, dismiss } = opts;
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Life bar and timeout always move together so the countdown never lies.
  const schedule = (ms: number) => {
    if (timer) clearTimeout(timer);
    life.value = withTiming(0, { duration: ms, easing: Easing.linear });
    timer = setTimeout(() => {
      anim.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(dismiss)();
      });
    }, ms);
  };

  const pause = () => {
    if (timer) clearTimeout(timer);
    cancelAnimation(life);
  };
  const resume = (frac: number) => schedule(Math.max(1000, frac * DURATION_MS));

  const start = () => {
    anim.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    if (!sticky) schedule(DURATION_MS);
  };
  const clear = () => {
    if (timer) clearTimeout(timer);
  };

  // Horizontal pan = OS-notification swipe. activeOffsetX keeps plain taps
  // flowing to the Pressable below (which carries the accessibility surface).
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      runOnJS(pause)();
    })
    .onUpdate((e) => {
      panX.value = e.translationX;
    })
    .onEnd((e) => {
      const shouldDismiss =
        Math.abs(e.translationX) > DISMISS_DX || Math.abs(e.velocityX) > DISMISS_VX;
      if (shouldDismiss) {
        const dir = Math.sign(e.translationX || e.velocityX) || 1;
        panX.value = withTiming(
          dir * width,
          { duration: 160, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(dismiss)();
          },
        );
      } else {
        panX.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) });
        if (!sticky) runOnJS(resume)(life.value);
      }
    });

  return { pan, start, clear };
};

/** Perpetually drifting chevrons — the visual "slide me away" affordance. */
const SwipeHint = () => {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(withTiming(1, { duration: 650 }), withTiming(0, { duration: 650 })),
      -1,
    );
  }, [drift]);
  const anim = useAnimatedStyle(() => ({
    opacity: 0.5 + drift.value * 0.5,
    transform: [{ translateX: drift.value * 5 }],
  }));
  return (
    <Animated.View style={anim} className="ml-3 flex-row items-center">
      <ChevronRightIcon color="#71717a" size={14} />
      <ChevronRightIcon color="#71717a" size={14} strokeWidth={1.6} />
    </Animated.View>
  );
};

const ToastView = ({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) => {
  const t = useT();
  const { scheme, accent, brand } = useTheme();
  const { width } = useWindowDimensions();
  const anim = useSharedValue(0);
  const life = useSharedValue(1);
  const panX = useSharedValue(0);

  const iconColor =
    toast.type === 'success'
      ? accent
      : toast.type === 'error'
        ? '#f87171'
        : scheme === 'dark'
          ? '#a1a1aa'
          : '#52525b';
  const Icon = ICON[toast.type];

  const dismiss = useCallback(() => onDone(toast.id), [onDone, toast.id]);
  // One controller per toast (keyed mount); width captured at creation is fine
  // for a 10s lifespan.
  const [ctrl] = useState(() =>
    makeToastController({ anim, life, panX, width, sticky: !!toast.sticky, dismiss }),
  );

  useEffect(() => {
    ctrl.start();
    return ctrl.clear;
  }, [ctrl]);

  const onPress = toast.action
    ? () => {
        toast.action?.onPress();
        onDone(toast.id);
      }
    : dismiss;

  const cardAnim = useAnimatedStyle(() => ({
    opacity: anim.value * interpolate(Math.abs(panX.value), [0, width / 2], [1, 0.35], 'clamp'),
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [-24, 0]) },
      { translateX: panX.value },
      { scale: interpolate(anim.value, [0, 1], [0.95, 1]) },
    ],
  }));
  const lifeAnim = useAnimatedStyle(() => ({ transform: [{ scaleX: life.value }] }));

  return (
    <Animated.View style={cardAnim} className="mt-2">
      <GestureDetector gesture={ctrl.pan}>
        <Pressable
          onPress={onPress}
          accessibilityRole={toast.action ? 'button' : 'alert'}
          accessibilityLabel={
            toast.action ? `${toast.message}. ${toast.action.label}` : toast.message
          }
        >
          <View
            style={{ elevation: 8 }}
            className={[
              'flex-row items-center overflow-hidden rounded-field border px-4 py-3 shadow-lg shadow-ink-950/40',
              SURFACE[toast.type],
            ].join(' ')}
          >
            <View
              className={[
                'mr-3 h-8 w-8 items-center justify-center rounded-full',
                CHIP[toast.type],
              ].join(' ')}
            >
              <Icon color={iconColor} size={16} strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-medium text-ink-100">{toast.message}</Text>
              <Text className="mt-0.5 text-[10px] text-ink-500">{t('toast.swipeHint')}</Text>
            </View>
            {toast.action ? (
              <View className="ml-3 flex-row items-center gap-0.5">
                <Text className="text-sm font-sans-semibold text-brand">{toast.action.label}</Text>
                <ChevronRightIcon color={brand} size={14} />
              </View>
            ) : (
              <SwipeHint />
            )}
            {/* Life bar — counts down the remaining time; pauses while dragging. */}
            {toast.sticky ? null : (
              <Animated.View
                style={lifeAnim}
                className={['absolute bottom-0 left-0 right-0 h-0.5', LIFE_BAR[toast.type]].join(
                  ' ',
                )}
              />
            )}
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const insets = useSafeAreaInsets();

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', opts?: ToastOptions) => {
    const id = nextId.current++;
    setToasts((prev) => [
      ...prev,
      { id, type, message, action: opts?.action, sticky: opts?.sticky },
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m, opts) => show(m, 'success', opts),
      error: (m, opts) => show(m, 'error', opts),
      info: (m, opts) => show(m, 'info', opts),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Right under the floating header pill (its bottom edge = top + 60). */}
      <View
        pointerEvents="box-none"
        style={{ top: insets.top + HEADER_PILL_BOTTOM }}
        className="absolute left-0 right-0 z-50 px-4"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onDone={remove} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>.');
  return ctx;
};
