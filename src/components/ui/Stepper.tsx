import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

type Props = {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Display formatter, e.g. seconds → `120s`. */
  format?: (n: number) => string;
  decLabel?: string;
  incLabel?: string;
};

const BTN = 'h-11 w-11 items-center justify-center rounded-field border border-ink-700 bg-ink-800';

/** Centered −/value/+ control; buttons disable at the bounds. */
export const Stepper = ({
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format = String,
  decLabel,
  incLabel,
}: Props) => {
  const { brand } = useTheme();
  const canDec = value - step >= min;
  const canInc = value + step <= max;

  return (
    <View className="items-center py-1">
      {label ? (
        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-center gap-5">
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={!canDec}
          accessibilityRole="button"
          accessibilityLabel={decLabel}
          className={[BTN, canDec ? '' : 'opacity-25'].join(' ')}
        >
          <MinusIcon color={brand} size={18} />
        </Pressable>
        <Text className="min-w-14 text-center text-xl font-sans-bold text-ink-50">
          {format(value)}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={!canInc}
          accessibilityRole="button"
          accessibilityLabel={incLabel}
          className={[BTN, canInc ? '' : 'opacity-25'].join(' ')}
        >
          <PlusIcon color={brand} size={18} />
        </Pressable>
      </View>
    </View>
  );
};
