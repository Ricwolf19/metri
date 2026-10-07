import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';

import { CheckIcon, TimerIcon, XIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT, type TFunction } from '@/i18n';
import { mmss } from '@/lib/duration';
import { useTheme } from '@/theme/theme-context';

type Props = {
  /** Wall-clock target (epoch ms) from the persisted rest state. */
  endsAt: number;
  /** Positive extends, negative shortens; the owner ends the rest when it hits zero. */
  onExtend: (seconds: number) => void;
  onDone: () => void;
};

/**
 * Shortcuts in one scrolling strip: the common extensions sit at scroll 0, the
 * reductions behind a divider. Bounded on purpose (+5 / −3 min): a longer rest
 * is a new rest, and the strip must stay one line (AGENTS.md: a strip of
 * badges scrolls, it never wraps).
 */
const EXTEND_SECONDS = [30, 60, 120, 180, 240, 300] as const;
const REDUCE_SECONDS = [-30, -60, -120, -180] as const;

const shiftLabel = (t: TFunction, seconds: number): string => {
  const minutes = Math.abs(seconds) / 60;
  if (seconds === 30) return t('training.restPlus30');
  if (seconds === -30) return t('training.restMinus30');
  return seconds > 0
    ? t('training.restPlusMin', { n: minutes })
    : t('training.restMinusMin', { n: minutes });
};

const ShiftPill = ({
  seconds,
  onPress,
  t,
}: {
  seconds: number;
  onPress: (seconds: number) => void;
  t: TFunction;
}) => (
  <Pressable
    onPress={() => onPress(seconds)}
    accessibilityRole="button"
    accessibilityLabel={shiftLabel(t, seconds)}
    className={[
      'min-h-12 items-center justify-center rounded-field border px-4',
      seconds > 0 ? 'border-brand/30 bg-brand/10' : 'border-ink-700 bg-ink-800',
    ].join(' ')}
  >
    <Text
      maxFontSizeMultiplier={CONTROL_FONT_SCALE}
      className={[
        'text-sm font-sans-semibold tabular-nums',
        seconds > 0 ? 'text-brand' : 'text-ink-300',
      ].join(' ')}
    >
      {shiftLabel(t, seconds)}
    </Text>
  </Pressable>
);

/**
 * Rest countdown banner, sized for a glance from the bench: the countdown is
 * the largest text on screen and every target is at least 48dp. Derives the
 * remaining time from `endsAt` (never decrements), so it stays exact across
 * background/foreground; the matching
 * lock-screen notification is owned by `features/notifications/rest-notification`.
 */
export const RestTimer = ({ endsAt, onExtend, onDone }: Props) => {
  const t = useT();
  const { brand, brandContrast } = useTheme();
  const [remaining, setRemaining] = useState(() => Math.ceil((endsAt - Date.now()) / 1000));
  const firedRef = useRef(false);
  const over = remaining <= 0;

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(left);
      // Reaching zero alerts but does NOT clear the rest: the alarm keeps going
      // until the lifter says they are back. The sound and the repeating buzz
      // belong to the rest foreground service, which is the only thing still
      // running once the screen goes off; this screen just changes its face.
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
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
  }, [endsAt]);

  return (
    <View
      className={[
        'rounded-card border px-4 py-4',
        over ? 'border-brand bg-brand/20' : 'border-brand/30 bg-brand/10',
      ].join(' ')}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TimerIcon color={brand} size={24} />
          <Text className="ml-2 text-base font-sans-semibold text-brand">
            {over ? t('training.restOver') : t('training.rest')}
          </Text>
        </View>
        {over ? null : (
          <Text className="text-4xl font-sans-bold tabular-nums text-brand">
            {mmss(Math.max(0, remaining))}
          </Text>
        )}
        <Pressable
          hitSlop={8}
          onPress={onDone}
          accessibilityRole="button"
          className={[
            'min-h-12 flex-row items-center rounded-full px-4',
            over ? 'bg-brand' : 'bg-brand/15',
          ].join(' ')}
        >
          <Text
            className={[
              'mr-1.5 text-sm font-sans-semibold',
              over ? 'text-brandContrast' : 'text-brand',
            ].join(' ')}
          >
            {over ? t('training.restReady') : t('training.skip')}
          </Text>
          {over ? <CheckIcon color={brandContrast} size={18} /> : <XIcon color={brand} size={18} />}
        </Pressable>
      </View>
      <View className="mt-3">
        <ScrollRow className="items-center gap-2">
          {EXTEND_SECONDS.map((s) => (
            <ShiftPill key={s} seconds={s} onPress={onExtend} t={t} />
          ))}
          <View className="mx-1 h-8 w-px bg-ink-700" />
          {REDUCE_SECONDS.map((s) => (
            <ShiftPill key={s} seconds={s} onPress={onExtend} t={t} />
          ))}
        </ScrollRow>
      </View>
    </View>
  );
};
