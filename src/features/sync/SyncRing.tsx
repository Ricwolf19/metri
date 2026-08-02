import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import type { SyncState } from './status';
import { useSyncState } from './useSyncState';

/** Ring color per state. Raw hex because `Animated` can't read CSS vars, and
 * these are status semantics — they shouldn't flip with the light/dark theme
 * the way brand tokens do. Mirrors the palette already used for errors
 * (`red-400`) and success (`brand`). */
const COLOR: Record<Exclude<SyncState, 'off'>, string> = {
  offline: '#71717a', // ink-400 — informational, not a failure
  syncing: '#38bdf8', // sky — work in flight
  synced: '#bef82b', // brand lime
  error: '#f87171', // red-400
};

/** Only `error` breathes: red is the one state that should pull the eye.
 * `syncing` stays steady — cycles are short and a blinking blue ring on every
 * foreground read as noise, not information. */
const ANIMATED: ReadonlySet<SyncState> = new Set<SyncState>(['error']);

/**
 * Status ring drawn around the avatar. Only premium users ever see it — the
 * state is `off` otherwise — so it doubles as the premium marker and the
 * `Avatar` star badge is dropped where this wraps it (their bounds overlap).
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
  const [opacity] = useState(() => new Animated.Value(1));

  const breathing = ANIMATED.has(state);

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
            borderColor: COLOR[state],
            opacity,
          }}
        />
      )}
      {children}
    </View>
  );
};
