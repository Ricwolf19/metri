/**
 * Observable sync status, for the ring around the avatar.
 *
 * The engine is a bare async function with no state, so this is the one place
 * that knows whether a cycle is running, when the last one succeeded, and
 * whether anything is still queued. Deliberately a tiny hand-rolled store
 * rather than a context: `TopBar` renders on ~25 screens and the engine has to
 * publish from outside React.
 */
export type SyncState =
  /** Not premium, or signed out — the ring is hidden entirely. */
  | 'off'
  /** No connectivity. Local writes keep queueing. */
  | 'offline'
  /** A cycle is in flight. */
  | 'syncing'
  /** Everything local has reached the server. */
  | 'synced'
  /** The last cycle failed while online. */
  | 'error';

type Listener = (state: SyncState) => void;

let current: SyncState = 'off';
const listeners = new Set<Listener>();

export const getSyncState = (): SyncState => current;

const publish = (next: SyncState): void => {
  if (next === current) return;
  current = next;
  for (const l of listeners) l(next);
};

let syncingDelay: ReturnType<typeof setTimeout> | null = null;

/**
 * `syncing` is debounced: an empty delta round-trips in well under a second,
 * and flashing the ring on every foreground/reconnect reads as flapping. Only
 * cycles still running after the delay surface; any terminal state cancels it.
 */
export const setSyncState = (next: SyncState): void => {
  if (syncingDelay) {
    clearTimeout(syncingDelay);
    syncingDelay = null;
  }
  if (next === 'syncing') {
    syncingDelay = setTimeout(() => {
      syncingDelay = null;
      publish('syncing');
    }, 600);
    return;
  }
  publish(next);
};

export const subscribeSyncState = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
