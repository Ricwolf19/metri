import { useRef, useState } from 'react';

/**
 * Runs a synchronous transition behind `<BlockingOverlay>`: `start` shows the
 * overlay, the overlay's `onShow` runs the work one frame later, and the
 * overlay clears unless the caller `keep`s it because the screen is about to
 * leave. A fixed delay before the work was never right: the Modal's own fade
 * is longer than it on iOS, and the heavy commit then froze the spinner.
 */
export const useBlockingTask = <K extends string>() => {
  const [busy, setBusy] = useState<K | null>(null);
  const pending = useRef<{ work: () => void; keep: boolean } | null>(null);

  const start = (kind: K, work: () => void, options?: { keep?: boolean }) => {
    if (pending.current) return;
    pending.current = { work, keep: !!options?.keep };
    setBusy(kind);
  };

  const onShow = () => {
    const job = pending.current;
    if (!job) return;
    // One more frame: the Modal is presented, but its first animated frame
    // commits after `onShow`; the work must not land before it.
    requestAnimationFrame(() => {
      pending.current = null;
      try {
        job.work();
      } finally {
        if (!job.keep) setBusy(null);
      }
    });
  };

  return { busy, start, onShow };
};
