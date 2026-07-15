import { storage } from '@/lib/storage';

/**
 * Per-user sync bookmarks in MMKV:
 *  - `cursor`: the server's ISO time from the last pull (delta pull key).
 *  - `pushedAt`: the highest local change-timestamp (epoch ms) already pushed.
 * Namespaced by userId so switching accounts on a device never crosses streams.
 */

const cursorKey = (userId: string) => `sync.cursor.${userId}`;
const pushKey = (userId: string) => `sync.pushedAt.${userId}`;

export const getCursor = (userId: string): string | null =>
  storage.getString(cursorKey(userId)) || null;

export const setCursor = (userId: string, cursor: string | null): void => {
  storage.set(cursorKey(userId), cursor ?? '');
};

export const getPushWatermark = (userId: string): number =>
  Number(storage.getString(pushKey(userId)) ?? '0');

export const setPushWatermark = (userId: string, ms: number): void => {
  storage.set(pushKey(userId), String(ms));
};
