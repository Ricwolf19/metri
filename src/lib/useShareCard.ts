import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { captureError } from './telemetry';

/** A fixed output size in pixels; without one the PNG is the view at the screen's density. */
export type CaptureSize = { width: number; height: number };

/** Some platforms reject when the share sheet is dismissed — a user choice, not a failure. */
export const isShareDismissal = (e: unknown): boolean =>
  /cancel|dismiss/i.test(e instanceof Error ? e.message : '');

/**
 * Capture a mounted view (a `ShareCard`, a progress card) as a PNG and hand it
 * to the OS share sheet. `share(size)` renders at that pixel size — a progress
 * card goes out 1080 wide whatever the phone — and the view's own on-screen
 * scale never matters: the capture draws the view, not its parents' transforms.
 */
export const useShareCard = (dialogTitle?: string) => {
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async (size?: CaptureSize): Promise<boolean> => {
    if (!ref.current || busy) return false;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) return false;
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        ...(size ? { width: Math.round(size.width), height: Math.round(size.height) } : null),
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
      return true;
    } catch (e) {
      if (!isShareDismissal(e)) captureError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { ref, share, busy };
};
