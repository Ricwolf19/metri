import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { localDateKey } from '@/features/training/dates';

import { buildExport } from './export-data';

const exportFileName = (date = new Date()): string => `metri-export-${localDateKey(date)}.json`;

/**
 * The export as a FILE in the cache directory, never as text: `Share.share`
 * with a `message` put the whole JSON on the Android share sheet as plain
 * text (the `url` is iOS-only there), which is what made a big export hang
 * with no sign of life. Building the document is synchronous — run it behind
 * `<BlockingOverlay>`.
 */
export const writeExportFile = async (userId: string): Promise<string> => {
  const json = JSON.stringify(buildExport(userId));
  const uri = `${FileSystem.cacheDirectory}${exportFileName()}`;
  await FileSystem.writeAsStringAsync(uri, json);
  return uri;
};

/** Hands the file to the OS share sheet; false when the device cannot share. */
export const shareExportFile = async (uri: string, dialogTitle: string): Promise<boolean> => {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle, UTI: 'public.json' });
  return true;
};
