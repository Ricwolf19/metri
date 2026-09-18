import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { captureError } from './telemetry';

/**
 * Capture a mounted view (a `ShareCard`) as a PNG and hand it to the OS share
 * sheet. Reusable for any card: training day, nutrition, progress, docs.
 */
export const useShareCard = (dialogTitle?: string) => {
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async (): Promise<boolean> => {
    if (!ref.current || busy) return false;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) return false;
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle });
      return true;
    } catch (e) {
      captureError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { ref, share, busy };
};
