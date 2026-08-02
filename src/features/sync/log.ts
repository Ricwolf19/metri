import { storage } from '@/lib/storage';

/**
 * Rolling sync activity log (last 50 entries, MMKV). This is the beta-support
 * surface: the ring says *that* something failed, the panel behind the avatar
 * shows *what* — a tester can screenshot it instead of plugging into logcat.
 * Single writer: `useAutoSync` (the only place cycles run).
 */

export type SyncLogEntry = {
  ts: number;
  kind: 'ok' | 'error' | 'info';
  message: string;
};

const KEY = 'sync.log';
const MAX = 50;

type Listener = () => void;
const listeners = new Set<Listener>();

// Snapshot cache: `useSyncExternalStore` compares snapshots with Object.is, so
// getSyncLog must return the SAME array until a write happens — re-parsing MMKV
// per call returned a fresh array every render and looped the component.
let cache: SyncLogEntry[] | null = null;

export const getSyncLog = (): SyncLogEntry[] => {
  if (cache) return cache;
  const raw = storage.getString(KEY);
  cache = raw ? (JSON.parse(raw) as SyncLogEntry[]) : [];
  return cache;
};

export const logSync = (kind: SyncLogEntry['kind'], message: string): void => {
  const next = [{ ts: Date.now(), kind, message }, ...getSyncLog()].slice(0, MAX);
  storage.set(KEY, JSON.stringify(next));
  cache = next;
  for (const l of listeners) l();
};

export const subscribeSyncLog = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
