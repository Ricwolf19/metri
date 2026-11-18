import * as Sharing from 'expo-sharing';

import { captureError } from './telemetry';

/**
 * Hand a file to the OS share sheet — the ONE way a file leaves metri (an
 * export, a PDF, a share card, a clip). What came of it is an answer, never an
 * exception: a dismissed sheet is the lifter's choice (some platforms reject
 * with "cancel"/"dismiss"), so only `failed` deserves a message, and only a
 * surprise reaches telemetry.
 */
export type ShareOutcome = 'shared' | 'dismissed' | 'unavailable' | 'failed';

export type SharedFileKind = 'json' | 'pdf' | 'png' | 'video';

const TYPES: Record<SharedFileKind, { mimeType: string; UTI: string }> = {
  json: { mimeType: 'application/json', UTI: 'public.json' },
  pdf: { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' },
  png: { mimeType: 'image/png', UTI: 'public.png' },
  video: { mimeType: 'video/mp4', UTI: 'public.mpeg-4' },
};

/** A clip's type follows its file: a gallery pick may be a .mov. */
const videoType = (uri: string) =>
  /\.mov$/i.test(uri)
    ? { mimeType: 'video/quicktime', UTI: 'com.apple.quicktime-movie' }
    : TYPES.video;

const isShareDismissal = (e: unknown): boolean =>
  /cancel|dismiss/i.test(e instanceof Error ? e.message : '');

export const shareFile = async (
  uri: string,
  kind: SharedFileKind,
  dialogTitle: string,
): Promise<ShareOutcome> => {
  try {
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    await Sharing.shareAsync(uri, {
      ...(kind === 'video' ? videoType(uri) : TYPES[kind]),
      dialogTitle,
    });
    return 'shared';
  } catch (e) {
    if (isShareDismissal(e)) return 'dismissed';
    captureError(e);
    return 'failed';
  }
};

/** Whether an outcome is worth telling the lifter about (`null`: a repeat tap, ignored). */
export const shareFailed = (outcome: ShareOutcome | null): boolean =>
  outcome === 'failed' || outcome === 'unavailable';
