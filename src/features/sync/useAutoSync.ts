import * as Network from 'expo-network';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

import { hasLocalChanges, syncNow } from './engine';
import { logSync } from './log';
import { setSyncState } from './status';

/** Minimum gap between idle cycles. Foreground/network events fire far more
 * often than data changes (Android emits network-state flaps constantly), and
 * every skipped cycle is a full round of server requests saved. A pending
 * local write bypasses the gap entirely, so a set logged offline still syncs
 * the moment signal returns. */
const COOLDOWN_MS = 60_000;
/** After a failure, retries back off exponentially (30s, 1m, 2m … capped at
 * 5m) instead of re-firing on every network flap — that loop is what kept the
 * ring flashing red/blue while hammering the API. */
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 5 * 60_000;

/**
 * Background sync for premium users. There is no manual trigger and no opt-in
 * toggle: with Premium, sync is simply on; without it, it never runs.
 *
 * Runs on mount and on every foreground, plus once connectivity comes back —
 * that last one matters because the common case is logging sets offline at the
 * gym and walking out into signal without ever backgrounding the app.
 *
 * Publishes to `status.ts` so the avatar ring can show what's happening;
 * failures stay silent in the UI (no toast on a flaky connection), the ring is
 * the only signal.
 */
export const useAutoSync = (): void => {
  const { user, can } = useAuth();
  const busy = useRef(false);
  const nextAllowedAt = useRef(0);
  const failures = useRef(0);
  const userId = user?.id;
  const enabled = !!userId && can('sync');

  useEffect(() => {
    if (!enabled || !userId) {
      setSyncState('off');
      return;
    }

    const run = async () => {
      if (busy.current) return;
      // Idle cycles respect the cooldown/backoff window; queued local changes
      // jump it — they are the whole point of syncing.
      if (Date.now() < nextAllowedAt.current && !hasLocalChanges(userId)) return;
      busy.current = true;
      setSyncState('syncing');
      try {
        const { pushed, pulled } = await syncNow(userId);
        // Only movements are logged — empty cycles would drown the panel.
        if (pushed || pulled) logSync('ok', `↑${pushed} ↓${pulled}`);
        failures.current = 0;
        nextAllowedAt.current = Date.now() + COOLDOWN_MS;
        setSyncState('synced');
      } catch (e) {
        // Distinguish "no signal" from "the server rejected us": only the
        // second is worth showing as an error — but both back off; retrying
        // into a dead network is as useless as retrying into a 500.
        failures.current += 1;
        const backoff = Math.min(BACKOFF_BASE_MS * 2 ** (failures.current - 1), BACKOFF_MAX_MS);
        nextAllowedAt.current = Date.now() + backoff;
        const state = await Network.getNetworkStateAsync().catch(() => null);
        const offline = !!state && !state.isConnected;
        if (!offline) logSync('error', e instanceof Error ? e.message : String(e));
        setSyncState(offline ? 'offline' : 'error');
      } finally {
        busy.current = false;
      }
    };

    void run();

    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void run();
    });
    const netSub = Network.addNetworkStateListener((state) => {
      if (state.isConnected) void run();
      else setSyncState('offline');
    });

    return () => {
      appSub.remove();
      netSub.remove();
    };
  }, [enabled, userId]);
};
