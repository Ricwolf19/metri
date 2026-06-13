import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { randomId } from '@/lib/crypto';

/** The app-private folder where progress photos are persisted. */
const photosDir = (): Directory => {
  const dir = new Directory(Paths.document, 'progress');
  if (!dir.exists) dir.create();
  return dir;
};

/**
 * Persist a picked image: copy the full-res file into the app dir and write a
 * downscaled thumbnail next to it. Returns both on-disk uris.
 */
export const persistPhoto = async (
  srcUri: string,
  id: string,
): Promise<{ uri: string; thumbUri: string }> => {
  const dir = photosDir();

  const full = new File(dir, `${id}.jpg`);
  await new File(srcUri).copy(full);

  const thumb = await manipulateAsync(srcUri, [{ resize: { width: 600 } }], {
    compress: 0.6,
    format: SaveFormat.JPEG,
  });
  const thumbDest = new File(dir, `${id}_thumb.jpg`);
  await new File(thumb.uri).copy(thumbDest);

  return { uri: full.uri, thumbUri: thumbDest.uri };
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

/** Remove the on-disk files for a photo (best-effort). */
export const deletePhotoFiles = (...uris: (string | null | undefined)[]): void => {
  for (const uri of uris) {
    if (!uri) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // ignore — file may already be gone
    }
  }
};
