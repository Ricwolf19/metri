import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; type: ToastType; message: string };

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ACCENT: Record<ToastType, string> = {
  success: 'border-lime-400/40 bg-ink-800',
  error: 'border-red-500/40 bg-ink-800',
  info: 'border-ink-500 bg-ink-800',
};

const DOT: Record<ToastType, string> = {
  success: 'bg-lime-400',
  error: 'bg-red-400',
  info: 'bg-ink-300',
};

const ToastView = ({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) => {
  // useState (not useRef) so the Animated.Value can be read during render without
  // tripping the refs-in-render lint rule; the initializer runs once.
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
        onDone(toast.id),
      );
    }, 2600);
    return () => clearTimeout(t);
  }, [anim, toast.id, onDone]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
      className="mt-2"
    >
      <Pressable onPress={() => onDone(toast.id)}>
        <View
          className={['flex-row items-center rounded-xl border px-4 py-3', ACCENT[toast.type]].join(
            ' ',
          )}
        >
          <View className={['mr-3 h-2 w-2 rounded-full', DOT[toast.type]].join(' ')} />
          <Text className="flex-1 text-sm text-ink-100">{toast.message}</Text>
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

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Bottom-anchored, lifted clear of the tab bar (which reserves the safe-area inset). */}
      <View
        pointerEvents="box-none"
        style={{ bottom: insets.bottom + 80 }}
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
