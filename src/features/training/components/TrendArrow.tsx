import { View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import type { Trend } from '../set-prefill';

/**
 * Up or down against the SAME set of the previous session. `info` (sky) for
 * more, the adherence "missed" red for less — a comparison, not a state, which
 * is why these two tones are allowed here. Same, empty or no history draws
 * nothing: the field's own grey outline is the resting look.
 */
export const TrendArrow = ({ trend }: { trend: Trend | null }) => {
  const t = useT();
  const { info } = useTheme();
  if (trend !== 'up' && trend !== 'down') return null;
  return (
    <View
      accessibilityLabel={t(trend === 'up' ? 'training.aboveLast' : 'training.belowLast')}
      className="justify-center pl-2"
    >
      {trend === 'up' ? (
        <ArrowUpIcon color={info} size={12} strokeWidth={2.5} />
      ) : (
        <ArrowDownIcon color={MISSED} size={12} strokeWidth={2.5} />
      )}
    </View>
  );
};
