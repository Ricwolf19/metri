import { useEffect, useRef, useState } from 'react';

const SETTLE_MS = 250;

/**
 * Feedback for "create then navigate": marks the trigger busy for a short
 * settle time so the freshly inserted row is seen before the push, instead of
 * the screen blinking into the next one.
 */
export const useBusyThen = (): [boolean, (action: () => void) => void] => {
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const run = (action: () => void) => {
    if (busy) return;
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      action();
    }, SETTLE_MS);
  };

  return [busy, run];
};
