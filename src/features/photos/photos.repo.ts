import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  progressCheckins,
  progressPhotos,
  type MediaAlign,
  type ProgressCheckin,
  type ProgressMediaKind,
  type ProgressPhoto,
  type ProgressPose,
} from '@/db/schema';
import { localDateKey } from '@/features/training/dates';
import { randomId } from '@/lib/crypto';

import { deletePhotoFiles, persistPhoto, persistVideo } from './media';

/**
 * Progress check-ins and their media. Every read and write is scoped by owner:
 * the progress routes are reachable through `metri://` deep links, so an id
 * alone must never surface — or delete — another account's photo on a shared
 * device. Local-only: nothing here is synced or sent.
 */

/** Live: a user's check-ins, newest first. */
export const checkinsQuery = (userId: string) =>
  db
    .select()
    .from(progressCheckins)
    .where(eq(progressCheckins.userId, userId))
    .orderBy(desc(progressCheckins.date), desc(progressCheckins.createdAt));

/** Live: every photo and clip of a user (grouped per check-in by `groupCheckins`). */
export const mediaQuery = (userId: string) =>
  db.select().from(progressPhotos).where(eq(progressPhotos.userId, userId));

export const getMedia = (id: string, userId: string): ProgressPhoto | null =>
  db
    .select()
    .from(progressPhotos)
    .where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)))
    .all()[0] ?? null;

export const getCheckin = (id: string, userId: string): ProgressCheckin | null =>
  db
    .select()
    .from(progressCheckins)
    .where(and(eq(progressCheckins.id, id), eq(progressCheckins.userId, userId)))
    .all()[0] ?? null;

export const createCheckin = (userId: string, date: string): ProgressCheckin => {
  const [row] = db
    .insert(progressCheckins)
    .values({ id: randomId(), userId, date })
    .returning()
    .all();
  return row;
};

export const updateCheckin = (
  id: string,
  userId: string,
  patch: { date?: string; note?: string | null },
): void => {
  db.update(progressCheckins)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(progressCheckins.id, id), eq(progressCheckins.userId, userId)))
    .run();
};

const mediaOf = (checkinId: string, userId: string): ProgressPhoto[] =>
  db
    .select()
    .from(progressPhotos)
    .where(and(eq(progressPhotos.checkinId, checkinId), eq(progressPhotos.userId, userId)))
    .all();

/**
 * Where a new photo or clip goes: a check-in that exists, or (`checkinId` null)
 * a new one dated `date`, created in the SAME transaction as the row — so a
 * save that fails leaves no empty check-in behind.
 */
type MediaTarget = { checkinId: string } | { checkinId: null; date: string };

export type NewMedia = MediaTarget & {
  kind: ProgressMediaKind;
  pose: ProgressPose | null;
  /** The camera's or the picker's file; copied in, never moved out of where it was. */
  srcUri: string;
  /** Clips only. */
  durationMs?: number | null;
  takenAt?: Date;
};

/**
 * Save a photo or clip into a check-in. A photo for a pose the check-in already
 * holds REPLACES it (a retake), files included — the new files are written
 * first, so a failed save never loses the old photo.
 */
export const addMedia = async (userId: string, input: NewMedia): Promise<ProgressPhoto> => {
  if (input.checkinId !== null && !getCheckin(input.checkinId, userId)) {
    throw new Error('addMedia: unknown check-in');
  }
  const id = randomId();
  const saved =
    input.kind === 'video'
      ? await persistVideo(input.srcUri, id, input.durationMs ?? null)
      : await persistPhoto(input.srcUri, id);
  const replaced =
    input.checkinId !== null && input.kind === 'photo' && input.pose
      ? mediaOf(input.checkinId, userId).filter((m) => m.kind === 'photo' && m.pose === input.pose)
      : [];
  let row: ProgressPhoto;
  try {
    row = db.transaction((tx) => {
      const checkinId = input.checkinId ?? randomId();
      if (input.checkinId === null) {
        tx.insert(progressCheckins).values({ id: checkinId, userId, date: input.date }).run();
      }
      for (const old of replaced)
        tx.delete(progressPhotos).where(eq(progressPhotos.id, old.id)).run();
      const [inserted] = tx
        .insert(progressPhotos)
        .values({
          id,
          userId,
          checkinId,
          kind: input.kind,
          pose: input.pose,
          uri: saved.uri,
          thumbUri: saved.thumbUri,
          width: saved.width || null,
          height: saved.height || null,
          durationMs: input.kind === 'video' ? (input.durationMs ?? null) : null,
          takenAt: input.takenAt ?? new Date(),
        })
        .returning()
        .all();
      return inserted;
    });
  } catch (e) {
    // No row points at the new files: they would sit in the private folder forever.
    deletePhotoFiles(saved.uri, saved.thumbUri);
    throw e;
  }
  for (const old of replaced) deletePhotoFiles(old.uri, old.thumbUri);
  return row;
};

/**
 * Re-tag a photo's pose. The photo already holding that pose in the same
 * check-in takes this one's old pose instead (a front/back mix-up is a swap),
 * so a check-in never holds two of one pose.
 */
export const setMediaPose = (id: string, userId: string, pose: ProgressPose | null): void => {
  const media = getMedia(id, userId);
  if (!media || media.pose === pose) return;
  db.transaction((tx) => {
    if (pose && media.checkinId && media.kind === 'photo') {
      tx.update(progressPhotos)
        .set({ pose: media.pose })
        .where(
          and(
            eq(progressPhotos.checkinId, media.checkinId),
            eq(progressPhotos.userId, userId),
            eq(progressPhotos.kind, 'photo'),
            eq(progressPhotos.pose, pose),
          ),
        )
        .run();
    }
    tx.update(progressPhotos).set({ pose }).where(eq(progressPhotos.id, id)).run();
  });
};

/** Remember how a photo lines up in the compare frame (null = reset). */
export const setMediaAlign = (id: string, userId: string, align: MediaAlign | null): void => {
  db.update(progressPhotos)
    .set({ align })
    .where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)))
    .run();
};

/** Delete one photo or clip; a check-in left empty goes with it (an empty card is noise). */
export const deleteMedia = (id: string, userId: string): void => {
  const media = getMedia(id, userId);
  if (!media) return;
  const { checkinId } = media;
  const last = checkinId !== null && mediaOf(checkinId, userId).every((m) => m.id === id);
  db.transaction((tx) => {
    tx.delete(progressPhotos).where(eq(progressPhotos.id, id)).run();
    if (last && checkinId)
      tx.delete(progressCheckins).where(eq(progressCheckins.id, checkinId)).run();
  });
  deletePhotoFiles(media.uri, media.thumbUri);
};

export const deleteCheckin = (id: string, userId: string): void => {
  const checkin = getCheckin(id, userId);
  if (!checkin) return;
  const media = mediaOf(id, userId);
  db.transaction((tx) => {
    tx.delete(progressPhotos)
      .where(and(eq(progressPhotos.checkinId, id), eq(progressPhotos.userId, userId)))
      .run();
    tx.delete(progressCheckins).where(eq(progressCheckins.id, id)).run();
  });
  for (const m of media) deletePhotoFiles(m.uri, m.thumbUri);
};

/**
 * File the photos taken before check-ins existed: one check-in per local day
 * they were taken on (joining one already there), pose left unsaid.
 * Idempotent — it only ever touches rows with no check-in — and cheap when
 * there is nothing to do, so the progress screens run it on mount.
 */
export const adoptLegacyPhotos = (userId: string): number => {
  const orphans = db
    .select()
    .from(progressPhotos)
    .where(and(eq(progressPhotos.userId, userId), isNull(progressPhotos.checkinId)))
    .all();
  if (!orphans.length) return 0;
  db.transaction((tx) => {
    const byDate = new Map<string, string>();
    const existing = tx
      .select()
      .from(progressCheckins)
      .where(eq(progressCheckins.userId, userId))
      .all();
    for (const c of existing) if (!byDate.has(c.date)) byDate.set(c.date, c.id);
    for (const photo of orphans) {
      const date = localDateKey(photo.takenAt);
      let checkinId = byDate.get(date);
      if (!checkinId) {
        checkinId = randomId();
        tx.insert(progressCheckins)
          .values({ id: checkinId, userId, date, note: photo.note, createdAt: photo.takenAt })
          .run();
        byDate.set(date, checkinId);
      }
      tx.update(progressPhotos).set({ checkinId }).where(eq(progressPhotos.id, photo.id)).run();
    }
  });
  return orphans.length;
};
