import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getWidgetInfo } from 'react-native-android-widget';

/**
 * Whether the Metri home-screen widget is on the user's launcher. Null while
 * unknown (first check pending, or a non-Android platform) — callers should
 * only act on an explicit false. Re-checks on foreground so adding/removing
 * the widget reflects without an app restart.
 */
export const useWidgetInstalled = (): boolean | null => {
  const [installed, setInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let alive = true;
    const check = () => {
      getWidgetInfo('Metri')
        .then((widgets) => {
          if (alive) setInstalled(widgets.length > 0);
        })
        .catch(() => {
          // Leave null — never pitch the banner on an unknown state.
        });
    };
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return installed;
};
