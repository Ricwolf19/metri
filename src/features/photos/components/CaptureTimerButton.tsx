import { Pressable, Text } from 'react-native';

import { TimerIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { TimerSeconds } from '../capture-flow';

/**
 * The self-timer as one pill: a tap moves off → 3 → 5 → 10 s. Lime with the
 * seconds while it is on, a plain disc while it is off.
 */
export const CaptureTimerButton = ({
  seconds,
  onPress,
  disabled,
}: {
  seconds: TimerSeconds;
  onPress: () => void;
  disabled: boolean;
}) => {
  const t = useT();
  const { brand, muted } = useTheme();
  const on = seconds > 0;
  const value = on ? t('capture.timerValue', { n: seconds }) : t('capture.timerOff');
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t('capture.timer', { value })}
      className={[
        'min-h-9 min-w-9 flex-row items-center justify-center gap-1 rounded-full px-2.5',
        on ? 'border border-brand/40 bg-brand/15' : 'bg-ink-800 active:bg-ink-700',
        disabled ? 'opacity-40' : '',
      ].join(' ')}
    >
      <TimerIcon color={on ? brand : muted} size={17} />
      {on ? (
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="font-mono-medium text-xs text-brand"
        >
          {value}
        </Text>
      ) : null}
    </Pressable>
  );
};
