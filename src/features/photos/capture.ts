import * as ImagePicker from 'expo-image-picker';

/** Launch the camera; returns the picked image uri, or null if denied/cancelled. */
export const pickFromCamera = async (): Promise<string | null> => {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
  return res.canceled ? null : res.assets[0].uri;
};

/** Launch the photo library; returns the picked image uri, or null. */
export const pickFromLibrary = async (): Promise<string | null> => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  return res.canceled ? null : res.assets[0].uri;
};
