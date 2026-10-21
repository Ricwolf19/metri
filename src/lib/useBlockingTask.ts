import { useRef, useState } from 'react';

/**
 * Runs a transition behind `<BlockingOverlay>`: `start` shows the overlay, the
 * overlay's `onShow` runs the work one frame later, and the overlay clears
 * once the work returns — or, for a job that returns a promise (build a file,
 * then hand it to the OS), once it settles — unless the caller `keep`s it
 * because the screen is about to leave. A fixed delay before the work was
 * never right: the Modal's own fade is longer than it on iOS, and the heavy
 * commit then froze the spinner.
 */
export const useBlockingTask = <K extends string>() => {
  const [busy, setBusy] = useState<K | null>(null);
  const pending = useRef<{ work: () => void | Promise<unknown>; keep: boolean } | null>(null);

  const start = (kind: K, work: () => void | Promise<unknown>, options?: { keep?: boolean }) => {
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
      const release = () => {
        if (!job.keep) setBusy(null);
      };
      let result: void | Promise<unknown>;
      try {
        result = job.work();
      } catch (e) {
        release();
        throw e;
      }
      if (result instanceof Promise) void result.finally(release);
      else release();
    });
  };

  return { busy, start, onShow };
};
