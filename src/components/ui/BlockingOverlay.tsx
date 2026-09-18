import { Text, View } from 'react-native';

import { BrandMark } from './BrandMark';

type Props = { visible: boolean; label?: string };

/**
 * Full-screen dim with the brand mark, for the few synchronous transitions the
 * app cannot avoid (language switch, saving a finished workout). Sits above the
 * content it covers; keep it under 1s of real work.
 */
export const BlockingOverlay = ({ visible, label }: Props) => {
  if (!visible) return null;
  return (
    <View
      pointerEvents="auto"
      className="absolute inset-0 items-center justify-center bg-ink-900/85"
      accessibilityLiveRegion="polite"
    >
      <BrandMark size={56} />
      {label ? <Text className="mt-4 text-sm text-ink-300">{label}</Text> : null}
    </View>
  );
};
