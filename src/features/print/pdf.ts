import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

import { localDateKey } from '@/features/training/dates';
import { captureError } from '@/lib/telemetry';
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

/** iOS rejects a closed printer picker or an unfinished job; Android just resolves. */
const isPrintDismissal = (e: unknown): boolean =>
  /cancel|did not complete/i.test(e instanceof Error ? e.message : '');

/**
 * The system print dialog (Android's also offers "Save as PDF"). Closing it is
 * an answer; anything else (no print service, a page that would not render) is
 * a real failure the caller tells the lifter about.
 */
export const printDocument = async (html: string): Promise<'printed' | 'dismissed' | 'failed'> => {
  try {
    await Print.printAsync({ html });
    return 'printed';
  } catch (e) {
    if (isPrintDismissal(e)) return 'dismissed';
    captureError(e);
    return 'failed';
  }
};
