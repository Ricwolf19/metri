import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { progressPhotos, type ProgressPhoto } from '@/db/schema';
import { randomId } from '@/lib/crypto';

import { deletePhotoFiles, persistPhoto } from './media';

/** Live query of a user's photos (newest first) — wrap with `useLiveQuery`. */
export const photosQuery = (userId: string) =>
  db
    .select()
    .from(progressPhotos)
    .where(eq(progressPhotos.userId, userId))
    .orderBy(desc(progressPhotos.takenAt));

/** Scoped by owner on purpose: `/progress/[id]` is reachable through the
 * `metri://` deep link, so an id alone must not surface — or allow deleting — a
 * photo belonging to another account on a shared device. */
export const getPhoto = (id: string, userId: string): ProgressPhoto | null => {
  const [row] = db
    .select()
    .from(progressPhotos)
    .where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)))
    .all();
  return row ?? null;
};

/** Persist a picked image to disk + insert its metadata row. */
export const addPhoto = async (
  userId: string,
  srcUri: string,
  meta: { takenAt: Date; weightKg?: number | null; note?: string | null },
): Promise<ProgressPhoto> => {
  const id = randomId();
  const { uri, thumbUri } = await persistPhoto(srcUri, id);
  const [row] = db
    .insert(progressPhotos)
    .values({
      id,
      userId,
      uri,
      thumbUri,
      takenAt: meta.takenAt,
      weightKg: meta.weightKg ?? null,
      note: meta.note ?? null,
    })
    .returning()
    .all();
  return row;
};

export const updatePhotoDate = (id: string, userId: string, takenAt: Date): void => {
  db.update(progressPhotos)
    .set({ takenAt })
    .where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)))
    .run();
};

export const deletePhoto = (id: string, userId: string): void => {
  const existing = getPhoto(id, userId);
  if (!existing) return;
  deletePhotoFiles(existing.uri, existing.thumbUri);
  db.delete(progressPhotos)
    .where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)))
    .run();
};
