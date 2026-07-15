import { Pressable, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { Input } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  /** Increment applied by the −/+ buttons (e.g. 2.5 kg, 5 lb, 1 rep). */
  step: number;
  min?: number;
  /** Decimal places to keep when bumping (0 for reps, 1 for weight). */
  decimals?: number;
  keyboardType?: 'decimal-pad' | 'number-pad';
  placeholder?: string;
  maxLength?: number;
};

/** A labelled numeric field flanked by −/+ steppers for fast in-gym entry. */
export const Stepper = ({
  label,
  value,
  onChangeText,
  step,
  min = 0,
  decimals = 0,
  keyboardType = 'decimal-pad',
  placeholder = '0',
  maxLength = 6,
}: Props) => {
  const { brand } = useTheme();

  const bump = (dir: 1 | -1) => {
    const current = Number(value);
    const base = Number.isFinite(current) && value !== '' ? current : 0;
    const factor = 10 ** decimals;
    const next = Math.max(min, Math.round((base + dir * step) * factor) / factor);
    onChangeText(String(next));
  };

  const btn =
    'h-12 w-11 items-center justify-center rounded-field border border-ink-700 bg-ink-800';

  return (
    <View className="flex-row items-end gap-2">
      <Pressable
        onPress={() => bump(-1)}
        accessibilityRole="button"
        accessibilityLabel={`− ${label}`}
        className={btn}
      >
        <MinusIcon color={brand} size={18} />
      </Pressable>
      <View className="flex-1">
        <Input
          label={label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      </View>
      <Pressable
        onPress={() => bump(1)}
        accessibilityRole="button"
        accessibilityLabel={`+ ${label}`}
        className={btn}
      >
        <PlusIcon color={brand} size={18} />
      </Pressable>
    </View>
  );
};
