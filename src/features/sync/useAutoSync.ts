import * as Network from 'expo-network';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

import { syncNow } from './engine';
import { setSyncState } from './status';

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
  const userId = user?.id;
  const enabled = !!userId && can('sync');

  useEffect(() => {
    if (!enabled || !userId) {
      setSyncState('off');
      return;
    }

    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      setSyncState('syncing');
      try {
        await syncNow(userId);
        setSyncState('synced');
      } catch {
        // Distinguish "no signal" from "the server rejected us": only the
        // second is worth showing as an error.
        const state = await Network.getNetworkStateAsync().catch(() => null);
        setSyncState(state && !state.isConnected ? 'offline' : 'error');
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
