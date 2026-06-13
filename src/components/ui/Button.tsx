import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
};

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-lime-400 active:bg-lime-500',
  secondary: 'bg-ink-700 active:bg-ink-600 border border-ink-600',
  ghost: 'bg-transparent active:bg-ink-800',
  danger: 'bg-red-500/15 active:bg-red-500/25 border border-red-500/40',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-ink-950',
  secondary: 'text-ink-50',
  ghost: 'text-ink-200',
  danger: 'text-red-400',
};

const PADDING: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

const TEXT_SIZE: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center rounded-xl',
        PADDING[size],
        CONTAINER[variant],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#08090d' : '#bef82b'} size="small" />
      ) : (
        <>
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={['font-semibold', TEXT_SIZE[size], LABEL[variant]].join(' ')}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};
