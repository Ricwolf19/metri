import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { usePressScale } from '@/lib/usePressScale';
import { useTheme } from '@/theme/theme-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
};

// Mirrors metri.info's button cva: monochrome `primary`, lime `brand`.
const CONTAINER: Record<Variant, string> = {
  primary: 'bg-ink-50 active:opacity-90',
  brand: 'bg-brand active:opacity-90',
  secondary: 'border border-ink-600 bg-ink-800 active:bg-ink-700',
  outline: 'border border-ink-600 bg-transparent active:bg-ink-800',
  ghost: 'bg-transparent active:bg-ink-800',
  danger: 'bg-red-500/15 active:bg-red-500/25 border border-red-500/40',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-ink-900',
  brand: 'text-brandContrast',
  secondary: 'text-ink-50',
  outline: 'text-ink-100',
  ghost: 'text-ink-200',
  danger: 'text-red-400',
};

const HEIGHT: Record<Size, string> = {
  sm: 'h-9 px-3.5',
  md: 'h-11 px-5',
  lg: 'h-12 px-6',
};

const TEXT_SIZE: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

export const Button = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  leftIcon,
  disabled,
  ...rest
}: Props) => {
  const isDisabled = disabled || loading;
  const { scale, onPressIn, onPressOut } = usePressScale();
  const { scheme } = useTheme();

  // Spinner colour tracks the label colour (which inverts per scheme for the
  // monochrome/neutral variants).
  const dark = scheme === 'dark';
  const spinnerColor: Record<Variant, string> = {
    primary: dark ? '#09090b' : '#fafafa',
    brand: dark ? '#08090d' : '#f7fee7',
    secondary: dark ? '#f5f5f7' : '#18181b',
    outline: dark ? '#e4e4e7' : '#27272a',
    ghost: dark ? '#d4d4d8' : '#3f3f46',
    danger: '#f87171',
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ transform: [{ scale }] }}
      className={[
        'flex-row items-center justify-center rounded-field',
        HEIGHT[size],
        CONTAINER[variant],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} size="small" />
      ) : (
        <>
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={['font-sans-semibold', TEXT_SIZE[size], LABEL[variant]].join(' ')}>
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};
