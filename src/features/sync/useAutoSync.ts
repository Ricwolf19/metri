import * as Network from 'expo-network';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { isNetworkFailure } from '@/lib/network-errors';
import { captureError } from '@/lib/telemetry';

import { hasLocalChanges, syncNow } from './engine';
import { SyncAuthError } from './errors';
import { logSync } from './log';
import { setSyncState } from './status';

/** Minimum gap between idle cycles: foreground/network events fire far more
 * often than data changes (Android emits network-state flaps constantly). A
 * pending local write bypasses the gap, so a set logged offline still syncs the
 * moment signal returns. */
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
  /** Set when the server refuses the session: nothing to retry until sign-in. */
  const refused = useRef(false);
  const userId = user?.id;
  const enabled = !!userId && can('sync');

  useEffect(() => {
    if (!enabled || !userId) {
      setSyncState('off');
      return;
    }

    refused.current = false;

    const run = async () => {
      if (busy.current || refused.current) return;
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
        if (e instanceof SyncAuthError) {
          // The session is gone, or the plan no longer includes sync. Neither
          // heals by retrying, so stop the loop and hide the ring; `revalidate`
          // clears a dead session on the next foreground and signing in again
          // re-enables this effect.
          refused.current = true;
          setSyncState('off');
          return;
        }
        // Offline backs off too: retrying into a dead network is as useless as
        // retrying into a 500.
        failures.current += 1;
        const backoff = Math.min(BACKOFF_BASE_MS * 2 ** (failures.current - 1), BACKOFF_MAX_MS);
        nextAllowedAt.current = Date.now() + backoff;
        // Read from the error itself, not the radio: `isConnected` is true on a
        // captive portal and on a DNS failure, and checking it after the fact
        // raced a reconnect into a false "the server rejected us".
        const offline = isNetworkFailure(e);
        if (!offline) {
          logSync('error', e instanceof Error ? e.message : String(e));
          captureError(e);
        }
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
