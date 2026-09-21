import { Text, View } from 'react-native';

import { CONTROL_FONT_SCALE } from './typography';

type Props = {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  /** Trailing control on the label's own line (e.g. a screen's Customize link). */
  right?: React.ReactNode;
  className?: string;
};

/** Mono, uppercase section heading (the small label above a card group). The optional hint
 * always stacks BELOW the label — never beside it, so long ES copy cannot push it off-screen. */
export const SectionLabel = ({ label, hint, icon, right, className }: Props) => (
  <View className={['mb-2', className ?? 'mt-7'].join(' ')}>
    <View className="flex-row items-center gap-2">
      {icon}
      <Text
        maxFontSizeMultiplier={CONTROL_FONT_SCALE}
        className="font-mono-medium text-xs uppercase tracking-wider text-ink-400"
      >
        {label}
      </Text>
      {right ? <View className="ml-auto shrink-0">{right}</View> : null}
    </View>
    {hint ? <Text className="mt-0.5 text-[11px] leading-4 text-ink-500">{hint}</Text> : null}
  </View>
);
