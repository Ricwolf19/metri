import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { TranslationKey } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import type { SyncState } from './status';
import { useSyncState } from './useSyncState';

type ShownState = Exclude<SyncState, 'off'>;

/** Short spoken name per state ("Sync status: offline, changes queued"). */
export const SYNC_STATE_KEY: Record<ShownState, TranslationKey> = {
  synced: 'sync.state.synced',
  syncing: 'sync.state.syncing',
  offline: 'sync.state.offline',
  error: 'sync.state.error',
};

/** The legend, in reading order, for the panel and the FAQ. */
export const SYNC_LEGEND: { state: ShownState; key: TranslationKey }[] = [
  { state: 'synced', key: 'sync.legendSynced' },
  { state: 'syncing', key: 'sync.legendSyncing' },
  { state: 'offline', key: 'sync.legendOffline' },
  { state: 'error', key: 'sync.legendError' },
];

/** Error red-400, as the panel prints errors; the rest are theme tones. */
const ERROR = '#f87171';

/** Ring colour per state, from the theme (`Animated` can't read CSS vars). */
const useRingColor = (): Record<ShownState, string> => {
  const { brand, info, muted } = useTheme();
  return { offline: muted, syncing: info, synced: brand, error: ERROR };
};

/** Offline is the one DASHED ring: a shape, not only a grey, says "not connected". */
const ringStyle = (state: ShownState) => (state === 'offline' ? 'dashed' : 'solid');

/** Only `error` breathes: red is the one state that should pull the eye.
 * `syncing` stays steady — cycles are short and a blinking blue ring on every
 * foreground read as noise, not information. */
const ANIMATED: ReadonlySet<SyncState> = new Set<SyncState>(['error']);

/** A legend swatch drawn like the ring itself: colour AND line style. */
export const SyncSwatch = ({ state }: { state: ShownState }) => {
  const color = useRingColor()[state];
  return (
    <View
      style={{ borderColor: color, borderStyle: ringStyle(state) }}
      className="h-3 w-3 rounded-full border-2"
    />
  );
};

/**
 * Status ring drawn around the avatar. Only premium users ever see it — the
 * state is `off` otherwise — so it doubles as the premium marker and the
 * `Avatar` star badge is dropped where this wraps it (their bounds overlap).
 * Its state is named by the button around it (`TopBar`, `SYNC_STATE_KEY`).
 *
 * The wrapper is always rendered at the same size, even when hidden: swapping
 * between a Fragment and a View would unmount the avatar on every state flip,
 * replaying `expo-image`'s fade and reflowing the row.
 */
export const SyncRing = ({
  size,
  gap = 3,
  children,
}: {
  size: number;
  gap?: number;
  children: React.ReactNode;
}) => {
  const state = useSyncState();
  const colors = useRingColor();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  // RN's Animated ignores the system setting: with reduce motion on, the error
  // ring stays steady (its colour and the panel still say what happened).
  const breathing = ANIMATED.has(state) && !reduced;

  useEffect(() => {
    if (!breathing) {
      opacity.setValue(1);
      return;
    }
    // Same shape as AppLoader's pulse so the app has one breathing rhythm.
    // Gentle: small amplitude + slow period, so it draws attention without strobing.
    const step = (to: number) =>
      Animated.timing(opacity, { toValue: to, duration: 1300, useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(0.55), step(1)]));
    loop.start();
    return () => loop.stop();
    // `state` is intentionally not a dep: a syncing -> error flip keeps the same
    // rhythm, and restarting the loop would jump the opacity mid-fade.
  }, [breathing, opacity]);

  const outer = size + gap * 2 + 4;
  return (
    <View style={{ width: outer, height: outer }} className="items-center justify-center">
      {state !== 'off' && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: outer,
            height: outer,
            borderRadius: outer / 2,
            borderWidth: 2,
            borderColor: colors[state],
            borderStyle: ringStyle(state),
            opacity,
          }}
        />
      )}
      {children}
    </View>
  );
};
