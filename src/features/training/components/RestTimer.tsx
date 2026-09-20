import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, Vibration, View } from 'react-native';

import { TimerIcon, XIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { mmss } from '@/lib/duration';
import { useTheme } from '@/theme/theme-context';

type Props = {
  /** Wall-clock target (epoch ms) from the persisted rest state. */
  endsAt: number;
  onExtend: (seconds: number) => void;
  onDone: () => void;
};

const EXTENSIONS = [
  { seconds: 30, key: 'training.restPlus30' },
  { seconds: 60, key: 'training.restPlus1' },
  { seconds: 120, key: 'training.restPlus2' },
] as const;

/**
 * Rest countdown banner. Derives the remaining time from `endsAt` (never
 * decrements), so it stays exact across background/foreground; the matching
 * lock-screen notification is owned by `features/notifications/rest-notification`.
 */
export const RestTimer = ({ endsAt, onExtend, onDone }: Props) => {
  const t = useT();
  const { brand } = useTheme();
  const [remaining, setRemaining] = useState(() => Math.ceil((endsAt - Date.now()) / 1000));
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true;
        Vibration.vibrate([0, 300, 150, 300]);
        onDone();
      }
    };
    const interval = setInterval(tick, 500);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    tick();
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [endsAt, onDone]);

  return (
    <View className="rounded-card border border-brand/30 bg-brand/10 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TimerIcon color={brand} size={20} />
          <Text className="ml-2 text-sm font-sans-semibold text-brand">{t('training.rest')}</Text>
        </View>
        <Text className="text-2xl font-sans-bold tabular-nums text-brand">
          {mmss(Math.max(0, remaining))}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={onDone}
          accessibilityRole="button"
          className="flex-row items-center rounded-full bg-brand/15 px-3 py-1.5"
        >
          <Text className="mr-1 text-xs font-sans-semibold text-brand">{t('training.skip')}</Text>
          <XIcon color={brand} size={14} />
        </Pressable>
      </View>
      <View className="mt-2 flex-row gap-2">
        {EXTENSIONS.map((ext) => (
          <Pressable
            key={ext.seconds}
            onPress={() => onExtend(ext.seconds)}
            accessibilityRole="button"
            className="h-9 flex-1 items-center justify-center rounded-field border border-ink-700 bg-ink-800"
          >
            <Text className="text-xs font-sans-semibold text-ink-200">{t(ext.key)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
