import { Directory, File, Paths } from 'expo-file-system';
import {
  ImageManipulator,
  manipulateAsync,
  SaveFormat,
  type ImageManipulatorContext,
  type ImageRef,
} from 'expo-image-manipulator';
import { createVideoPlayer } from 'expo-video';

import { randomId } from '@/lib/crypto';

import { joinMediaUri } from './media-path';

/**
 * The files behind progress media. They live in ONE app-private folder
 * (`documents/progress/`), are never written to the gallery, and SQLite only
 * keeps their paths — see the note above `progressCheckins` in the schema.
 */
const FOLDER = 'progress';

/** A photo's long edge on disk: sharp on any phone, ~0.5 MB instead of a 12 MP original. */
const PHOTO_EDGE = 2160;
const PHOTO_QUALITY = 0.88;
const THUMB_WIDTH = 600;
const THUMB_QUALITY = 0.7;
/** Where in a clip its poster frame is taken (seconds): past the first, often dark, frame. */
const POSTER_AT_S = 0.5;

const photosDir = (): Directory => {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create();
  return dir;
};

let base: string | null = null;
/** The folder's uri in THIS install, read once. */
const baseUri = (): string => (base ??= photosDir().uri);

export const mediaUri = (stored: string): string => joinMediaUri(baseUri(), stored);

export type SavedMedia = { uri: string; thumbUri: string; width: number; height: number };

/**
 * Persist a picked or captured photo: re-encoded at `PHOTO_EDGE` on its long
 * edge (orientation applied) with a thumbnail beside it. The source (the
 * camera's cache file, a gallery pick) is left where it was.
 */
export const persistPhoto = async (srcUri: string, id: string): Promise<SavedMedia> => {
  const dir = photosDir();
  // Every decoded image is native memory (a 12 MP photo is ~48 MB): each one is
  // released on the way out, a failed render or save included.
  const refs = new Set<ImageRef>();
  const render = async (context: ImageManipulatorContext): Promise<ImageRef> => {
    const ref = await context.renderAsync();
    refs.add(ref);
    return ref;
  };
  try {
    const source = await render(ImageManipulator.manipulate(srcUri));
    const landscape = source.width > source.height;
    const long = Math.max(source.width, source.height);
    const full =
      long > PHOTO_EDGE
        ? await render(
            ImageManipulator.manipulate(source).resize(
              landscape ? { width: PHOTO_EDGE } : { height: PHOTO_EDGE },
            ),
          )
        : source;
    const thumb = await render(ImageManipulator.manipulate(full).resize({ width: THUMB_WIDTH }));
    const fullSaved = await full.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
    const thumbSaved = await thumb.saveAsync({ compress: THUMB_QUALITY, format: SaveFormat.JPEG });
    const fullDest = new File(dir, `${id}.jpg`);
    const thumbDest = new File(dir, `${id}_thumb.jpg`);
    await new File(fullSaved.uri).move(fullDest);
    await new File(thumbSaved.uri).move(thumbDest);
    return {
      uri: fullDest.uri,
      thumbUri: thumbDest.uri,
      width: fullSaved.width,
      height: fullSaved.height,
    };
  } finally {
    for (const ref of refs) ref.release();
  }
};

/**
 * Persist a clip: copied as it was recorded, plus a poster frame as its
 * thumbnail. A poster that cannot be read is not a failure — the clip is
 * saved and the tile draws a play glyph instead (`thumbUri` '').
 */
export const persistVideo = async (
  srcUri: string,
  id: string,
  durationMs: number | null,
): Promise<SavedMedia> => {
  const dir = photosDir();
  const ext = /\.(\w{2,4})$/.exec(srcUri)?.[1]?.toLowerCase() ?? 'mp4';
  const dest = new File(dir, `${id}.${ext}`);
  await new File(srcUri).copy(dest);

  const at = durationMs ? Math.min(POSTER_AT_S, durationMs / 2000) : 0;
  const player = createVideoPlayer(dest.uri);
  try {
    const [frame] = await player.generateThumbnailsAsync(at, { maxWidth: THUMB_WIDTH });
    try {
      const poster = await ImageManipulator.manipulate(frame).renderAsync();
      try {
        const saved = await poster.saveAsync({ compress: THUMB_QUALITY, format: SaveFormat.JPEG });
        const thumbDest = new File(dir, `${id}_thumb.jpg`);
        await new File(saved.uri).move(thumbDest);
        return { uri: dest.uri, thumbUri: thumbDest.uri, width: frame.width, height: frame.height };
      } finally {
        poster.release();
      }
    } finally {
      frame.release();
    }
  } catch {
    return { uri: dest.uri, thumbUri: '', width: 0, height: 0 };
  } finally {
    player.release();
  }
};

/** Persist a square-ish avatar image (resized) and return its on-disk uri. */
export const persistAvatar = async (srcUri: string): Promise<string> => {
  const dir = photosDir();
  const resized = await manipulateAsync(srcUri, [{ resize: { width: 400 } }], {
    compress: 0.8,
    format: SaveFormat.JPEG,
  });
  const dest = new File(dir, `avatar-${randomId()}.jpg`);
  await new File(resized.uri).copy(dest);
  return dest.uri;
};

/** Remove the files behind stored paths, found by name in our folder (best-effort). */
export const deletePhotoFiles = (...stored: (string | null | undefined)[]): void => {
  for (const path of stored) {
    if (!path) continue;
    try {
      const file = new File(mediaUri(path));
      if (file.exists) file.delete();
    } catch {
      // ignore — the file may already be gone
    }
  }
};
