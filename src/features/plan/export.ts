import * as FileSystem from 'expo-file-system/legacy';
import { Share } from 'react-native';

import { buildExport } from './export-data';

/** Writes the export to a JSON file and opens the OS share sheet. */
export const exportUserData = async (userId: string): Promise<void> => {
  const json = JSON.stringify(buildExport(userId), null, 2);
  const uri = `${FileSystem.documentDirectory}metri-export.json`;
  try {
    await FileSystem.writeAsStringAsync(uri, json);
    await Share.share({ url: uri, message: json, title: 'Metri data export' });
  } catch {
    // Fall back to sharing the raw JSON if the file write/share is unavailable.
    await Share.share({ message: json, title: 'Metri data export' });
  }
};
