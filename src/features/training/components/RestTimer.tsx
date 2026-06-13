import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TimerIcon, XIcon } from '@/components/icons';

type Props = {
  /** Countdown length in seconds. */
  seconds: number;
  label: string;
  skipLabel: string;
  onDone: () => void;
};

const mmss = (total: number): string => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
};

/**
 * A self-contained rest countdown banner. Mount it (with a changing `key`) when
 * a set is logged; it ticks down and calls `onDone` at zero or when skipped.
 */
export const RestTimer = ({ seconds, label, skipLabel, onDone }: Props) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onDone]);

  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-accentFill px-5 py-3">
      <View className="flex-row items-center">
        <TimerIcon color="#0b0f14" size={20} />
        <Text className="ml-2 text-sm font-semibold text-ink-950">{label}</Text>
      </View>
      <Text className="text-2xl font-extrabold tabular-nums text-ink-950">{mmss(remaining)}</Text>
      <Pressable
        hitSlop={8}
        onPress={onDone}
        accessibilityRole="button"
        className="flex-row items-center rounded-full bg-ink-950/10 px-3 py-1.5"
      >
        <Text className="mr-1 text-xs font-semibold text-ink-950">{skipLabel}</Text>
        <XIcon color="#0b0f14" size={14} />
      </Pressable>
    </View>
  );
};
