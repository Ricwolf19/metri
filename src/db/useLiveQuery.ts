import { is } from 'drizzle-orm';
import {
  getTableConfig,
  getViewConfig,
  SQLiteTable,
  SQLiteView,
  type AnySQLiteSelect,
} from 'drizzle-orm/sqlite-core';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { useState, useSyncExternalStore, type DependencyList } from 'react';

import { makeLiveRunner, type Scheduler } from './live-runner';

/**
 * A select at any stage of the builder (`.where()` narrows the type to an
 * `Omit`, so `AnySQLiteSelect` itself does not match): what the hook needs is
 * the result type (`then`) and the synchronous reader (`all`).
 */
type LiveSelect = Pick<AnySQLiteSelect, '_' | 'then' | 'all'>;

/** The table (or view) a select reads; Drizzle keeps it on the query's config. */
const sourceName = (query: LiveSelect): string | null => {
  const entity = (query as unknown as { config: { table: unknown } }).config.table;
  if (is(entity, SQLiteTable)) return getTableConfig(entity).name;
  if (is(entity, SQLiteView)) return getViewConfig(entity).name;
  return null;
};

const nextFrame: Scheduler = (callback) => {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
};

type Snapshot<T> = { data: Awaited<T>; updatedAt: Date };

/**
 * One query as an external store: the snapshot is read synchronously on first
 * ask and replaced — once per frame, however many rows changed — when the
 * query's table is written. Listeners share one DB subscription.
 */
const makeStore = <T extends LiveSelect>(query: T) => {
  const name = sourceName(query);
  let snapshot: Snapshot<T> | null = null;
  const listeners = new Set<() => void>();
  let teardown: (() => void) | null = null;
  const read = () => {
    snapshot = { data: query.all() as Awaited<T>, updatedAt: new Date() };
  };
  return {
    getSnapshot: (): Snapshot<T> => {
      if (!snapshot) read();
      return snapshot as Snapshot<T>;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1 && name) {
        const runner = makeLiveRunner(() => {
          read();
          for (const l of listeners) l();
        }, nextFrame);
        const change = addDatabaseChangeListener(({ tableName }) => {
          if (tableName === name) runner.notify();
        });
        teardown = () => {
          runner.dispose();
          change.remove();
        };
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          teardown?.();
          teardown = null;
        }
      };
    },
  };
};

const sameDeps = (a: DependencyList, b: DependencyList) =>
  a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

/**
 * metri's live query — the one the screens import, in place of Drizzle's.
 * Same contract: the query is captured on mount and re-bound when `deps`
 * change, so `deps` are LOAD-BEARING (a screen that mounts before auth
 * resolves otherwise stays bound to `userId: ''` and reads back nothing); here
 * they are mandatory, so the compiler finds a missing array. Three things
 * differ from Drizzle's hook: the first read is synchronous, so a screen never
 * paints an empty frame before its rows; a change re-queries once per frame
 * however many rows the write touched (SQLite notifies per row); and the
 * query runs on the JS thread (`all()`), which for these local reads is
 * cheaper than the async round trip it replaces.
 */
export const useLiveQuery = <T extends LiveSelect>(query: T, deps: DependencyList): Snapshot<T> => {
  // The store follows the deps, not the query object (a fresh one every render):
  // new deps during render swap the store before anything below reads it.
  const [cell, setCell] = useState(() => ({ deps, store: makeStore(query) }));
  if (!sameDeps(cell.deps, deps)) setCell({ deps, store: makeStore(query) });
  const store = sameDeps(cell.deps, deps) ? cell.store : makeStore(query);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
