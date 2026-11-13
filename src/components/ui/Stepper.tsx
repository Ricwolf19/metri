import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { CONTROL_FONT_SCALE } from './typography';

type Props = {
  label?: string;
  /** null = deliberately unset — shows "—"; the + button seeds `unsetSeed` (or `min`). */
  value: number | null;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unsetSeed?: number;
  /** Display formatter, e.g. seconds → `120s`. */
  format?: (n: number) => string;
  /** Defaults to "Decrease {label}" / "Increase {label}". */
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
  unsetSeed,
  format = String,
  decLabel,
  incLabel,
}: Props) => {
  const t = useT();
  const { brand } = useTheme();
  const canDec = value != null && value - step >= min;
  const canInc = value == null || value + step <= max;
  const seed = unsetSeed ?? (Number.isFinite(min) ? min : step);
  const shown = value == null ? '—' : format(value);
  // Each button names the field it moves and reads the value it is moving.
  const a11yValue = { text: value == null ? t('common.notSet') : shown };

  return (
    <View className="items-center py-1">
      {label ? (
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="mb-1.5 text-center font-mono-medium text-xs uppercase tracking-wider text-ink-300"
        >
          {label}
        </Text>
      ) : null}
      {/* The gaps are spacers that give way: two steppers share a row in the slot
          editor (~145 dp each on a 360 dp phone), and a fixed gap pushed the
          buttons past their half and over the neighbour's. */}
      <View className="max-w-full flex-row items-center justify-center">
        <Pressable
          onPress={() => onChange(Math.max(min, (value ?? seed) - step))}
          disabled={!canDec}
          accessibilityRole="button"
          accessibilityLabel={
            decLabel ?? (label ? t('common.decreaseNamed', { label }) : t('common.decrease'))
          }
          accessibilityValue={a11yValue}
          className={[BTN, canDec ? '' : 'opacity-25'].join(' ')}
        >
          <MinusIcon color={brand} size={18} />
        </Pressable>
        <View className="w-5 shrink" />
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="min-w-14 text-center text-xl font-sans-bold text-ink-50"
          accessibilityLabel={label ? `${label}: ${a11yValue.text}` : a11yValue.text}
        >
          {shown}
        </Text>
        <View className="w-5 shrink" />
        <Pressable
          onPress={() => onChange(value == null ? seed : Math.min(max, value + step))}
          disabled={!canInc}
          accessibilityRole="button"
          accessibilityLabel={
            incLabel ?? (label ? t('common.increaseNamed', { label }) : t('common.increase'))
          }
          accessibilityValue={a11yValue}
          className={[BTN, canInc ? '' : 'opacity-25'].join(' ')}
        >
          <PlusIcon color={brand} size={18} />
        </Pressable>
      </View>
    </View>
  );
};
