import { useEffect, useRef, useState } from 'react';

const SETTLE_MS = 250;

type Run = <T>(open: (created: T) => void, create?: () => T) => void;

/**
 * Feedback for "create then navigate": marks the trigger busy for a short
 * settle time so the freshly inserted row is seen before the push, instead of
 * the screen blinking into the next one. `create` (the insert) runs at once,
 * `open` after the settle; a press while busy runs NEITHER — the insert used to
 * sit before the guard, so a double tap on "Add phase" made two phases. The
 * guard is a ref, not the state: a second tap can land before the re-render.
 */
export const useBusyThen = (): [boolean, Run] => {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const run: Run = (open, create) => {
    if (running.current) return;
    running.current = true;
    let created: Parameters<typeof open>[0];
    try {
      created = create?.() as Parameters<typeof open>[0];
    } catch (e) {
      running.current = false;
      throw e;
    }
    setBusy(true);
    timer.current = setTimeout(() => {
      running.current = false;
      setBusy(false);
      open(created);
    }, SETTLE_MS);
  };

  return [busy, run];
};
