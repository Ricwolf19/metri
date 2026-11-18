import { Pressable, Text } from 'react-native';

import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';

/**
 * The self-timer's number, big enough to read from where the lifter stands.
 * The whole frame is the cancel button while it runs.
 */
export const CaptureCountdown = ({
  seconds,
  onCancel,
}: {
  seconds: number;
  onCancel: () => void;
}) => {
  const t = useT();
  return (
    <Pressable
      onPress={onCancel}
      accessibilityRole="button"
      accessibilityLabel={t('capture.countdownCancel')}
      className="absolute inset-0 items-center justify-center bg-ink-950/35"
    >
      {/* The frame is a control (a tap cancels): its text caps the OS font scale like any. */}
      <Text
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className="font-sans-bold text-ink-50"
        style={{ fontSize: 120, lineHeight: 132 }}
      >
        {seconds}
      </Text>
      <Text
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className="mt-2 font-mono-medium text-xs uppercase tracking-wider text-ink-100"
      >
        {t('capture.countdownCancel')}
      </Text>
    </Pressable>
  );
};
