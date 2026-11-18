import * as ImagePicker from 'expo-image-picker';

import { keepUnlockedWhile } from '@/features/app-lock/lock';

/**
 * The system pickers. Each runs through `keepUnlockedWhile`: the picker (and
 * a permission dialog) is another activity on Android, and that trip must not
 * relock the private section that opened it.
 */

/** Launch the camera; returns the picked image uri, or null if denied/cancelled. */
export const pickFromCamera = (): Promise<string | null> =>
  keepUnlockedWhile(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
    return res.canceled ? null : res.assets[0].uri;
  });

/** Launch the photo library; returns the picked image uri, or null. */
export const pickFromLibrary = (): Promise<string | null> =>
  keepUnlockedWhile(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    return res.canceled ? null : res.assets[0].uri;
  });

export type PickedClip = { uri: string; durationMs: number | null };

/** Pick a clip from the library; null if denied or cancelled. */
export const pickClipFromLibrary = (): Promise<PickedClip | null> =>
  keepUnlockedWhile(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
    if (res.canceled) return null;
    const asset = res.assets[0];
    return { uri: asset.uri, durationMs: asset.duration ?? null };
  });
