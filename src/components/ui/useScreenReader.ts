import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether TalkBack / VoiceOver is running, kept current while the screen is
 * up. For surfaces that act on a timer or a gesture a screen reader cannot
 * follow; never to hide content from anyone.
 */
export const useScreenReader = (): boolean => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((on) => {
      if (live) setEnabled(on);
    });
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return enabled;
};
