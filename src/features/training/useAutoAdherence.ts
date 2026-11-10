import { useEffect } from 'react';
import { AppState } from 'react-native';

import { captureError } from '@/lib/telemetry';

import { reconcileAutoAdherence } from './auto-adherence.repo';

/** Keeps the calendar filled while the app is used: on mount and on every foreground. */
export const useAutoAdherence = (userId: string | undefined): void => {
  useEffect(() => {
    if (!userId) return;
    const run = () => {
      try {
        reconcileAutoAdherence(userId);
      } catch (e) {
        captureError(e);
      }
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [userId]);
};
