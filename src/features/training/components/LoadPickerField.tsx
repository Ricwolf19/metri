import { Pressable, Text, View } from 'react-native';

import { DumbbellIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { trendPhrase } from '../session-a11y';
import type { Trend } from '../set-prefill';
import { TrendArrow } from './TrendArrow';
import { UnitSuffix } from './UnitSuffix';

type Props = {
  /** The total, in the display unit; empty until a load is picked. */
  value: string;
  unitLabel: string;
  onPress: () => void;
  /** Against the same set of the previous session; drawn above the unit. */
  trend?: Trend | null;
};

/**
 * The weight field of an exercise loaded with plates or a pin stack: not a
 * keyboard but the load sheet, so the number is always one the rack can
 * build — the prefill arrives as plates, and a change is a plate or a pin,
 * never a typed total the bar cannot hold. Same box as `SetInput` (the reps
 * field sits beside it), with the dumbbell glyph saying where a tap leads.
 */
export const LoadPickerField = ({ value, unitLabel, onPress, trend = null }: Props) => {
  const t = useT();
  const { info, muted } = useTheme();
  const empty = value === '';
  // The arrow inside is part of this one element, so its direction rides in the label.
  const label = [
    `${t('training.weight')}: ${empty ? t('training.pickLoad') : `${value} ${unitLabel}`}`,
    trendPhrase(trend, t),
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={t('training.pickLoadHint')}
      className="min-h-12 flex-row items-stretch overflow-hidden rounded-field border border-info/40 bg-ink-900 active:bg-ink-850"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-2 px-2.5 py-2">
        <DumbbellIcon color={empty ? muted : info} size={16} />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className={[
            'min-w-0 flex-1 text-base tabular-nums',
            empty ? 'text-ink-500' : 'text-ink-50',
          ].join(' ')}
        >
          {empty ? t('training.pickLoad') : value}
        </Text>
      </View>
      <View className="items-center justify-center border-l border-ink-700 bg-ink-850 px-2">
        <TrendArrow trend={trend} accessible={false} />
        <UnitSuffix label={unitLabel} />
      </View>
    </Pressable>
  );
};
