import { View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import { trendPhrase } from '../session-a11y';
import type { Trend } from '../set-prefill';

/**
 * Up or down against the SAME set of the previous session. `info` (sky) for
 * more, the adherence "missed" red for less — a comparison, not a state, which
 * is why these two tones are allowed here. Same, empty or no history draws a
 * faint dash in the same footprint: the unit box keeps its height and never
 * shows a hole where an arrow may appear. The direction is its own element for
 * a screen reader (a bare View's label is never read); a parent that already
 * names it (`LoadPickerField`) passes `accessible={false}`.
 */
export const TrendArrow = ({
  trend,
  accessible = true,
}: {
  trend: Trend | null;
  accessible?: boolean;
}) => {
  const t = useT();
  const { info, muted } = useTheme();
  const label = trendPhrase(trend, t);
  if (!label) {
    return (
      <View
        importantForAccessibility="no-hide-descendants"
        className="h-3 items-center justify-center opacity-40"
      >
        <MinusIcon color={muted} size={12} strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessible ? label : undefined}
      importantForAccessibility={accessible ? 'yes' : 'no-hide-descendants'}
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
