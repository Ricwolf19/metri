import { View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import type { Trend } from '../set-prefill';

/**
 * Up or down against the SAME set of the previous session. `info` (sky) for
 * more, the adherence "missed" red for less — a comparison, not a state, which
 * is why these two tones are allowed here. Same, empty or no history draws a
 * faint dash in the same footprint: the unit box keeps its height and never
 * shows a hole where an arrow may appear.
 */
export const TrendArrow = ({ trend }: { trend: Trend | null }) => {
  const t = useT();
  const { info, muted } = useTheme();
  if (trend !== 'up' && trend !== 'down') {
    return (
      <View className="h-3 items-center justify-center opacity-40">
        <MinusIcon color={muted} size={12} strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={t(trend === 'up' ? 'training.aboveLast' : 'training.belowLast')}
      className="h-3 items-center justify-center"
    >
      {trend === 'up' ? (
        <ArrowUpIcon color={info} size={12} strokeWidth={2.5} />
      ) : (
        <ArrowDownIcon color={MISSED} size={12} strokeWidth={2.5} />
      )}
    </View>
  );
};
