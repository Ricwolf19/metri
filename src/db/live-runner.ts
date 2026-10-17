/** Schedules one callback and returns its cancel. */
export type Scheduler = (callback: () => void) => () => void;

/**
 * Coalesces change notifications into ONE run per scheduled tick. SQLite's
 * change listener fires once per ROW, so a 30-set write re-ran every live
 * query on the screen thirty times; with this, each hook re-queries once,
 * on the next frame, however many rows the write touched.
 */
export const makeLiveRunner = (run: () => void, schedule: Scheduler) => {
  let cancel: (() => void) | null = null;
  return {
    /** A change arrived: run on the next tick unless one is already due. */
    notify: () => {
      if (cancel) return;
      cancel = schedule(() => {
        cancel = null;
        run();
      });
    },
    /** Drop a pending run (unmount, deps change). */
    dispose: () => {
      cancel?.();
      cancel = null;
    },
  };
};
