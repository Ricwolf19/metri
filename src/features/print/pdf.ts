import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { localDateKey } from '@/features/training/dates';
import { fold } from '@/lib/text';

/**
 * The only module importing `expo-print`. A document is built on the phone
 * from the HTML builders in this folder and goes nowhere on its own: the
 * lifter hands the file to the share sheet, or prints it from the system's
 * dialog. Nothing is uploaded or kept beyond the cache directory.
 */

/** "metri-strength-block-2026-11-17.pdf" — a file name a chat or a printer queue can show. */
export const pdfFileName = (title: string, date = new Date()): string => {
  const slug = fold(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `metri-${slug || 'document'}-${localDateKey(date)}.pdf`;
};

/** Renders `html` to a PDF in the cache directory, under `fileName`; returns its uri. */
export const writePdf = async (html: string, fileName: string): Promise<string> => {
  const { uri } = await Print.printToFileAsync({ html });
  const target = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: target });
  return target;
};

/** Hands the PDF to the OS share sheet; false when the device cannot share. */
export const sharePdf = async (uri: string, dialogTitle: string): Promise<boolean> => {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  return true;
};

/**
 * The system print dialog (Android's also offers "Save as PDF"). Closing it is
 * an answer, and the platform reports that as a rejection — never an error.
 */
export const printDocument = (html: string): Promise<void> =>
  Print.printAsync({ html }).catch(() => undefined);
