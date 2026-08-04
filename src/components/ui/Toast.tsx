import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, InfoCircleIcon, WarningIcon, type IconProps } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

import { HEADER_CLEARANCE } from './Screen';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** Long enough to actually read; errors linger longer still. */
const DURATION: Record<ToastType, number> = { success: 4000, info: 4000, error: 5500 };

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

const ToastView = ({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) => {
  const { scheme, accent } = useTheme();
  const anim = useSharedValue(0);
  const life = useSharedValue(1);

  const iconColor =
    toast.type === 'success'
      ? accent
      : toast.type === 'error'
        ? '#f87171'
        : scheme === 'dark'
          ? '#a1a1aa'
          : '#52525b';
  const Icon = ICON[toast.type];
  const duration = DURATION[toast.type];

  useEffect(() => {
    // Springy drop-in from the top edge; the life bar then counts down the
    // remaining time so the auto-dismiss never feels arbitrary.
    anim.value = withSpring(1, { damping: 16, stiffness: 180 });
    life.value = withTiming(0, { duration, easing: Easing.linear });
    const t = setTimeout(() => {
      anim.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)(toast.id);
      });
    }, duration);
    return () => clearTimeout(t);
  }, [anim, life, duration, toast.id, onDone]);

  const enterAnim = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [
      { translateY: interpolate(anim.value, [0, 1], [-24, 0]) },
      { scale: interpolate(anim.value, [0, 1], [0.95, 1]) },
    ],
  }));
  const lifeAnim = useAnimatedStyle(() => ({ transform: [{ scaleX: life.value }] }));

  return (
    <Animated.View style={enterAnim} className="mt-2">
      <Pressable onPress={() => onDone(toast.id)} accessibilityRole="alert">
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
          <Text className="flex-1 text-sm font-sans-medium text-ink-100">{toast.message}</Text>
          {/* Life bar — shrinks over the toast's lifetime (scaleX keeps it on the
              native driver; the symmetric collapse reads as a countdown). */}
          <Animated.View
            style={lifeAnim}
            className={['absolute bottom-0 left-0 right-0 h-0.5', LIFE_BAR[toast.type]].join(' ')}
          />
        </View>
      </Pressable>
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

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Anchored below the floating header zone so a toast never covers the
          nav controls; still clear of thumbs and the tab bar. */}
      <View
        pointerEvents="box-none"
        style={{ top: insets.top + HEADER_CLEARANCE + 6 }}
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
