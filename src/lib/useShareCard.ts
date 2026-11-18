import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { shareFile, type ShareOutcome } from './share-file';
import { captureError } from './telemetry';

/** A fixed output size in pixels; without one the PNG is the view at the screen's density. */
export type CaptureSize = { width: number; height: number };

/**
 * Capture a mounted view (a `ShareCard`, a progress card) as a PNG and hand it
 * to the OS share sheet. `share(size)` renders at that pixel size — a progress
 * card goes out 1080 wide whatever the phone — and the view's own on-screen
 * scale never matters: the capture draws the view, not its parents' transforms.
 *
 * Resolves to what came of it (`shareFailed` says whether to tell the lifter);
 * `null` is a tap while one is already under way. The guard is a ref, not the
 * `busy` state: a double tap lands before the re-render that would disable it.
 */
export const useShareCard = (dialogTitle: string) => {
  const ref = useRef<View>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);

  const share = async (size?: CaptureSize): Promise<ShareOutcome | null> => {
    if (!ref.current || inFlight.current) return null;
    inFlight.current = true;
    setBusy(true);
    try {
      let uri: string;
      try {
        uri = await captureRef(ref, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          ...(size ? { width: Math.round(size.width), height: Math.round(size.height) } : null),
        });
      } catch (e) {
        captureError(e);
        return 'failed';
      }
      return await shareFile(uri, 'png', dialogTitle);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return { ref, share, busy };
};
