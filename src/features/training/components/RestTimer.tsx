import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, Vibration, View } from 'react-native';

import { TimerIcon, XIcon } from '@/components/icons';
import {
  cancelNotifications,
  dismissOngoing,
  ensureNotificationPermission,
  presentOngoing,
  scheduleOneShot,
} from '@/features/notifications/service';
import { useTheme } from '@/theme/theme-context';

type Props = {
  /** Countdown length in seconds. */
  seconds: number;
  label: string;
  skipLabel: string;
  /** Notification copy for the backgrounded case. */
  notifyTitle: string;
  notifyBody: string;
  /** Ongoing-notification copy while resting ("done at {time}"). */
  ongoingTitle: string;
  ongoingBody: string;
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
 *
 * The countdown is anchored to a wall-clock target (`endsAt`) so it stays exact
 * across background/foreground transitions — JS timers freeze in the background,
 * so a plain per-second decrement would drift. A one-shot local notification is
 * scheduled on mount to fire if the app is backgrounded, and cancelled if the
 * timer completes in the foreground (we beat the OS) or the user skips.
 */
export const RestTimer = ({
  seconds,
  label,
  skipLabel,
  notifyTitle,
  notifyBody,
  ongoingTitle,
  ongoingBody,
  onDone,
}: Props) => {
  const { brand } = useTheme();
  const [endsAt] = useState(() => Date.now() + seconds * 1000);
  const [remaining, setRemaining] = useState(seconds);
  const notifId = useRef<string | null>(null);
  const ongoingId = useRef<string | null>(null);
  const doneRef = useRef(false);

  // Schedule the backup OS notification on mount; cancel on unmount (skip/next).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const granted = await ensureNotificationPermission();
      if (!granted || cancelled) return;
      const id = await scheduleOneShot('rest-timer', seconds, {
        title: notifyTitle,
        body: notifyBody,
      }).catch(() => null);
      if (cancelled) void cancelNotifications([id]);
      else notifId.current = id;
      // Android: a sticky "resting until HH:MM" so leaving the app keeps the
      // timer visible. Wall-clock text, so it never needs re-rendering.
      const sticky = await presentOngoing('rest-timer', {
        title: ongoingTitle,
        body: ongoingBody,
      }).catch(() => null);
      if (cancelled) void dismissOngoing(sticky);
      else ongoingId.current = sticky;
    })();
    return () => {
      cancelled = true;
      void cancelNotifications([notifId.current]);
      void dismissOngoing(ongoingId.current);
      notifId.current = null;
      ongoingId.current = null;
    };
    // Stable for the component's life (remounted via `key` per rest), so this runs once.
  }, [seconds, notifyTitle, notifyBody, ongoingTitle, ongoingBody]);

  // Tick from the clock; resync immediately when returning to the foreground.
  useEffect(() => {
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true;
        Vibration.vibrate([0, 300, 150, 300]);
        void cancelNotifications([notifId.current]);
        void dismissOngoing(ongoingId.current);
        notifId.current = null;
        ongoingId.current = null;
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
    <View className="flex-row items-center justify-between rounded-card border border-brand/30 bg-brand/10 px-5 py-3">
      <View className="flex-row items-center">
        <TimerIcon color={brand} size={20} />
        <Text className="ml-2 text-sm font-sans-semibold text-brand">{label}</Text>
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
        <Text className="mr-1 text-xs font-sans-semibold text-brand">{skipLabel}</Text>
        <XIcon color={brand} size={14} />
      </Pressable>
    </View>
  );
};
