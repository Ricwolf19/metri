import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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

// min-height + padding, never a fixed height: a two-line label (long ES copy in
// narrow side-by-side buttons) grows the button instead of clipping inside it.
const SIZE_BOX: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 py-1.5',
  md: 'min-h-11 px-5 py-2.5',
  lg: 'min-h-12 px-6 py-3',
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
  const pressAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
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
      style={pressAnim}
      className={[
        'flex-row items-center justify-center rounded-field',
        SIZE_BOX[size],
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
          <Text
            className={[
              'shrink text-center',
              'font-sans-semibold',
              TEXT_SIZE[size],
              LABEL[variant],
            ].join(' ')}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};
