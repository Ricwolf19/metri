import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

import { syncNow } from './engine';

/**
 * Silent background sync for premium users: once on mount and whenever the app
 * returns to the foreground. Errors are swallowed (offline/transient) — the
 * manual "Sync now" button surfaces failures. A ref guards against overlapping
 * runs. No-op for free users.
 */
export const useAutoSync = (): void => {
  const { user, can } = useAuth();
  const busy = useRef(false);
  const userId = user?.id;
  const enabled = !!userId && can('sync');

  useEffect(() => {
    if (!enabled || !userId) return;
    const run = () => {
      if (busy.current) return;
      busy.current = true;
      syncNow(userId)
        .catch(() => {})
        .finally(() => {
          busy.current = false;
        });
    };
    run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') run();
    });
    return () => sub.remove();
  }, [enabled, userId]);
};
