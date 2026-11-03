import { useEffect } from 'react';
import { AppState } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { computeWidgetSnapshot } from './data';
import { MetriWidget } from './MetriWidget';
import { writeWidgetSnapshot } from './snapshot';

/**
 * Keeps the home-screen widget fed while the app is used: on mount, on every
 * foreground and on the way to the BACKGROUND — the moment the lifter looks at
 * the home screen, right after finishing a workout or between sets — recompute
 * the snapshot, persist it for the headless task handler, and push a render.
 * Failures are swallowed — the widget is a bonus surface, never a reason to
 * break the shell.
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
      if (state === 'active' || state === 'background') run();
    });
    return () => sub.remove();
  }, []);
};
