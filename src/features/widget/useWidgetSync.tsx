import { useEffect } from 'react';
import { AppState } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { computeWidgetSnapshot } from './data';
import { MetriWidget } from './MetriWidget';
import { writeWidgetSnapshot } from './snapshot';

/**
 * Keeps the home-screen widget fed while the app is used: on mount and on every
 * foreground, recompute the snapshot, persist it for the headless task handler,
 * and push a render. Failures are swallowed — the widget is a bonus surface,
 * never a reason to break the shell.
 */
export const useWidgetSync = (): void => {
  useEffect(() => {
    const run = (): void => {
      try {
        const snapshot = computeWidgetSnapshot();
        if (!snapshot) return;
        writeWidgetSnapshot(snapshot);
        void requestWidgetUpdate({
          widgetName: 'Metri',
          renderWidget: (info) => <MetriWidget snapshot={snapshot} height={info.height} />,
        }).catch(() => {});
      } catch {
        // widget updates must never break the app
      }
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, []);
};
