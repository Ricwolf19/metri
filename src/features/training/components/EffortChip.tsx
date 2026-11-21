import { Pressable, Text } from 'react-native';

import { FlameIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { EffortMode } from '@/db/schema';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { effortWords } from '../labels';
import { effortChipLabel } from '../session-a11y';
import type { Effort } from '../workout-drafts';

type Props = {
  /** The effort on the row the control bar drives (the live row or a correction). */
  effort: Effort | null;
  /** That row's prescription measures effort: the empty chip is tinted to say so. */
  wantsEffort: boolean;
  /** How the session reads effort (`effortModeFor`): the notation the chip speaks. */
  effortMode: EffortMode;
  /** Opens the effort sheet. */
  onPress: () => void;
};

/**
 * The effort pick in the session card's control bar, beside the ± pairs. Named
 * with the value it holds ("Effort: 2 in reserve"), and as tall as the ± pairs.
 */
export const EffortChip = ({ effort, wantsEffort, effortMode, onPress }: Props) => {
  const t = useT();
  const { danger } = useTheme();
  // The effort chip names the pick in the session's notation ("RIR 2", "Hard").
  const effortText = effort
    ? effortWords({ rir: effort.rir, isFailure: effort.failure }, t, effortMode)
    : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={effortChipLabel(effort, t, effortMode)}
      accessibilityHint={t('training.effortTitle')}
      className={[
        'min-h-11 flex-row items-center justify-center gap-1 rounded-field border px-3',
        effort
          ? effort.failure
            ? 'border-red-400/50 bg-red-500/15'
            : 'border-brand/40 bg-brand/10'
          : wantsEffort
            ? 'border-brand/25 bg-ink-800'
            : 'border-ink-700 bg-ink-800',
      ].join(' ')}
    >
      {effort?.failure ? <FlameIcon color={danger} size={14} /> : null}
      <Text
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className={[
          'text-xs font-sans-semibold',
          effort ? (effort.failure ? 'text-red-400' : 'text-brand') : 'text-ink-200',
        ].join(' ')}
      >
        {effortText ?? (effortMode === 'simple' ? t('training.effortShort') : 'RIR')}
      </Text>
    </Pressable>
  );
};
