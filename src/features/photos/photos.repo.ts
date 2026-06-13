import { desc, eq } from 'drizzle-orm';

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

export const getPhoto = (id: string): ProgressPhoto | null => {
  const [row] = db.select().from(progressPhotos).where(eq(progressPhotos.id, id)).all();
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

export const updatePhotoDate = (id: string, takenAt: Date): void => {
  db.update(progressPhotos).set({ takenAt }).where(eq(progressPhotos.id, id)).run();
};

export const deletePhoto = (id: string): void => {
  const existing = getPhoto(id);
  if (!existing) return;
  deletePhotoFiles(existing.uri, existing.thumbUri);
  db.delete(progressPhotos).where(eq(progressPhotos.id, id)).run();
};
